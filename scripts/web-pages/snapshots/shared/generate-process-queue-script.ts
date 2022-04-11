import chalk from "chalk";
import envalid from "envalid";
import _ from "lodash";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../../../shared/clean-env";
import { getErrorMessage } from "../../../../shared/errors";
import { serializeTime } from "../../../../shared/helpers-for-json";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  readSnapshotQueueDocument,
  reportSnapshotQueueAttempt,
} from "../../../../shared/snapshot-queues";

export const generateProcessQueueScript =
  ({
    output,
    snapshotGeneratorId,
  }: {
    output: WriteStream;
    snapshotGeneratorId: SnapshotGeneratorId;
  }) =>
  async () => {
    const env = cleanEnv({
      FILTER_URL: envalid.str({
        desc: "Regex to use when filtering URLs",
        default: ".*",
      }),
    });
    const filterUrlRegex = RegexParser(env.FILTER_URL);

    const snapshotGenerator = getSnapshotGenerator(snapshotGeneratorId);
    output.write(
      chalk.bold(`Processing ${snapshotGenerator.name} snapshot queue\n`),
    );

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
        !item.attempts?.some((attempt) => attempt.status === "completed"),
    );

    output.write(
      chalk.green(`Queue items to process: ${itemsToProcess.length}\n`),
    );

    const orderedItemsToProcess = _.orderBy(
      itemsToProcess,
      (item) => item.attempts?.at(-1)?.startedAt,
    );

    let numberOfAttempts = 0;
    let numberOfCompletedAttempts = 0;
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

      try {
        const message = (await snapshotGenerator.takeSnapshot({
          abortController,
          snapshotContext: item.context,
          webPageUrl: item.webPageUrl,
        })) as string | undefined;

        if (abortController.signal.aborted) {
          return;
        }

        await reportSnapshotQueueAttempt({
          attemptMessage: message,
          attemptStartedAt,
          attemptStatus: "completed",
          snapshotGeneratorId,
          snapshotQueueItemId: item.id,
        });

        numberOfCompletedAttempts += 1;
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
        `\nDone. Attempts: ${numberOfAttempts} (${numberOfCompletedAttempts} completed, ${numberOfFailedAttempts} failed)\n`,
      );
    }
  };
