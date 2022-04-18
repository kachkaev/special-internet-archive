import chalk from "chalk";
import envalid from "envalid";
import _ from "lodash";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../shared/clean-env";
import { getErrorMessage } from "../../shared/errors";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  readSnapshotQueueDocument,
  reportSnapshotQueueAttempt,
} from "../../shared/snapshot-queues";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";

const generateWebPageDirPathByUrl = async (): Promise<
  Record<string, string>
> => {
  const result: Record<string, string> = {};

  await processWebPages({
    processWebPage: ({ webPageDirPath, webPageDocument }) => {
      result[webPageDocument.webPageUrl] = webPageDirPath;
    },
  });

  return result;
};

export const generateProcessSnapshotQueueScript =
  ({
    output,
    snapshotGeneratorId,
  }: {
    output: WriteStream;
    snapshotGeneratorId: SnapshotGeneratorId;
  }) =>
  async () => {
    const snapshotGenerator = getSnapshotGenerator(snapshotGeneratorId);
    output.write(
      chalk.bold(`Processing ${snapshotGenerator.name} snapshot queue\n`),
    );

    const env = cleanEnv({
      FILTER_URL: envalid.str({
        desc: "Regex to use when filtering URLs",
        default: ".*",
      }),
    });
    const filterUrlRegex = RegexParser(env.FILTER_URL);

    const webPageDirPathByUrl: Record<string, string> =
      await generateWebPageDirPathByUrl();

    output.write(
      `${chalk.green(`Queue file:`)} ${generateSnapshotQueueDocumentPath(
        snapshotGeneratorId,
      )}\n`,
    );

    const snapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );

    const itemsToProcess = snapshotQueueDocument.items.filter(
      (item) =>
        item.webPageUrl.match(filterUrlRegex) &&
        !item.attempts?.some((attempt) => attempt.status === "succeeded"),
    );

    output.write(
      chalk.green(`Queue items to process: ${itemsToProcess.length}\n`),
    );

    const orderedItemsToProcess = _.orderBy(
      itemsToProcess,
      (item) => item.attempts?.at(-1)?.startedAt,
    );

    let numberOfAttempts = 0;
    let numberOfSucceededAttempts = 0;
    let numberOfFailedAttempts = 0;

    const abortController = new AbortController();
    process.on("SIGINT", () => {
      output.write(
        chalk.yellow("\n\nQueue processing was aborted with SIGINT.\n"),
      );
      abortController.abort();
    });

    for (const item of orderedItemsToProcess) {
      if (abortController.signal.aborted as unknown as boolean) {
        break;
      }

      output.write(`\n${chalk.underline(item.webPageUrl)}`);

      output.write(
        chalk.green(`\n  added to queue at: ${chalk.blue(item.addedAt)}`),
      );

      if (item.attempts?.length) {
        output.write(
          chalk.yellow(`  previous attempts: ${item.attempts.length}`),
        );
      }

      numberOfAttempts += 1;
      const attemptStartedAt = serializeTime();

      await reportSnapshotQueueAttempt({
        attemptStartedAt,
        attemptStatus: "started",
        snapshotGeneratorId,
        snapshotQueueItemId: item.id,
      });

      const abortHandler = () => {
        void reportSnapshotQueueAttempt({
          attemptStartedAt,
          attemptStatus: "aborted",
          snapshotGeneratorId,
          snapshotQueueItemId: item.id,
        });
      };
      abortController.signal.addEventListener("abort", abortHandler);

      const webPageDirPath = webPageDirPathByUrl[item.webPageUrl];
      if (!webPageDirPath) {
        output.write(
          chalk.yellow(
            `\n  unable locate ${item.webPageUrl} in your collection. Did you delete a previously registered page? Skipping.`,
          ),
        );
        continue;
      }

      try {
        const message = (await snapshotGenerator.captureSnapshot({
          abortSignal: abortController.signal,
          snapshotContext: item.context,
          webPageDirPath,
          webPageUrl: item.webPageUrl,
        })) as string | undefined;

        if (abortController.signal.aborted) {
          return;
        }

        await reportSnapshotQueueAttempt({
          attemptMessage: message,
          attemptStartedAt,
          attemptStatus: "succeeded",
          snapshotGeneratorId,
          snapshotQueueItemId: item.id,
        });

        numberOfSucceededAttempts += 1;
      } catch (error) {
        abortController.signal.removeEventListener("abort", abortHandler);
        if (abortController.signal.aborted) {
          return;
        }

        const attemptMessage = getErrorMessage(error);
        output.write(chalk.red(`\n  attempt failed: ${attemptMessage}`));

        await reportSnapshotQueueAttempt({
          attemptMessage,
          attemptStartedAt,
          attemptStatus: "failed",
          snapshotGeneratorId,
          snapshotQueueItemId: item.id,
        });

        numberOfFailedAttempts += 1;
      }
    }

    if (!abortController.signal.aborted) {
      if (itemsToProcess.length > 0) {
        output.write("\n");
      }
      output.write(
        `\nDone. Attempts: ${numberOfAttempts} (${numberOfSucceededAttempts} succeeded, ${numberOfFailedAttempts} failed)\n`,
      );
    }
  };
