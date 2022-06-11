import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../shared/clean-env";
import { relevantTimeMin } from "../../shared/collection";
import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import {
  AbortError,
  ExitCodeError,
  UserFriendlyError,
} from "../../shared/errors";
import { generateProgress } from "../../shared/generate-progress";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import {
  assertSnapshotGeneratorMatchesFilter,
  getSnapshotGenerator,
} from "../../shared/snapshot-generators";
import { PreviousFailuresInSnapshotQueue } from "../../shared/snapshot-generators/types";
import {
  generateSnapshotQueueDocumentPath,
  readSnapshotQueueDocument,
  reportSnapshotQueueAttempts,
} from "../../shared/snapshot-queues";
import { serializeTime } from "../../shared/time";
import { generateWebPageDirPathLookup } from "../../shared/web-page-documents";

const previousFailuresInSnapshotQueue: PreviousFailuresInSnapshotQueue[] = [];

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

    if (snapshotGenerator.role === "local") {
      await syncCollectionIfNeeded({
        output,
        mode: "preliminary",
      });
    }

    output.write(
      chalk.bold(`Processing ${snapshotGenerator.name} snapshot queue\n`),
    );

    assertSnapshotGeneratorMatchesFilter({ output, snapshotGeneratorId });

    const env = cleanEnv({
      MAX_NUMBER_OF_FAILED_ATTEMPTS: envalid.num({
        default: 100,
        desc: "Queue processing is terminated after this number of failures",
      }),
      FILTER_URL: envalid.str({
        default: "",
        desc: "Regex to filter web page URLs",
      }),
    });
    const maxNumberOfFailedAttempts = env.MAX_NUMBER_OF_FAILED_ATTEMPTS;
    const filterUrlRegex = env.FILTER_URL
      ? RegexParser(env.FILTER_URL)
      : undefined;

    if (
      maxNumberOfFailedAttempts < 0 ||
      Math.round(maxNumberOfFailedAttempts) !== maxNumberOfFailedAttempts
    ) {
      throw new UserFriendlyError(
        "Expected MAX_NUMBER_OF_FAILED_ATTEMPTS to be a non-negative integer number",
      );
    }

    const webPageDirPathByUrl = await generateWebPageDirPathLookup();

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
        (!filterUrlRegex || item.webPageUrl.match(filterUrlRegex)) &&
        !item.attempts?.some((attempt) => attempt.status === "succeeded"),
    );

    output.write(
      chalk.green(`Queue items to process: ${itemsToProcess.length}\n`),
    );

    if (itemsToProcess.length === 0) {
      return;
    }

    const orderedItemsToProcess = _.orderBy(
      itemsToProcess,
      (item) => item.attempts?.at(-1)?.startedAt,
    );

    if (snapshotGenerator.massCaptureSnapshots) {
      output.write(chalk.green(`Attempting to mass-capture all snapshots... `));
      const attemptStartedAt = serializeTime();

      const snapshotQueueItemIds = orderedItemsToProcess.map((item) => item.id);

      await reportSnapshotQueueAttempts({
        attemptStartedAt,
        attemptStatus: "started",
        snapshotGeneratorId,
        snapshotQueueItemIds,
      });

      const operationResult = await snapshotGenerator.massCaptureSnapshots({
        webPagesUrls: orderedItemsToProcess.map((item) => item.webPageUrl),
      });

      if (operationResult.status !== "skipped") {
        await reportSnapshotQueueAttempts({
          attemptMessage: operationResult.message,
          attemptStartedAt,
          attemptStatus:
            operationResult.status === "processed" ? "succeeded" : "failed",
          snapshotGeneratorId,
          snapshotQueueItemIds,
        });

        output.write(
          (operationResult.status === "processed" ? chalk.magenta : chalk.red)(
            `Done${
              operationResult.message ? `. ${operationResult.message}` : ""
            }`,
          ),
        );

        return;
      }

      output.write(
        chalk.gray(
          `Skipped.${
            operationResult.message ? ` ${operationResult.message}` : ""
          }\n`,
        ),
      );
    }

    let numberOfAttempts = 0;
    let numberOfSucceededAttempts = 0;
    let numberOfFailedAttempts = 0;

    const abortController = new AbortController();

    const handleSigint = () => {
      output.write(
        chalk.yellow("\n\nQueue processing was aborted with SIGINT\n"),
      );
      abortController.abort();
      process.off("SIGINT", handleSigint);
    };
    process.on("SIGINT", handleSigint);

    try {
      for (const [itemIndex, item] of orderedItemsToProcess.entries()) {
        const { progress, progressPrefix } = generateProgress(
          itemIndex,
          orderedItemsToProcess.length,
        );

        output.write(`\n${progress}${chalk.underline(item.webPageUrl)}`);

        if (item.attempts?.length) {
          output.write(
            chalk.yellow(` Previous attempts: ${item.attempts.length}`),
          );
        }

        numberOfAttempts += 1;
        const attemptStartedAt = serializeTime();

        await reportSnapshotQueueAttempts({
          attemptStartedAt,
          attemptStatus: "started",
          snapshotGeneratorId,
          snapshotQueueItemIds: [item.id],
        });

        const abortHandler = () => {
          void reportSnapshotQueueAttempts({
            attemptStartedAt,
            attemptStatus: "aborted",
            snapshotGeneratorId,
            snapshotQueueItemIds: [item.id],
          });
        };

        const webPageDirPath = webPageDirPathByUrl[item.webPageUrl];
        if (!webPageDirPath) {
          output.write(
            chalk.yellow(
              `\n${progressPrefix}unable locate ${item.webPageUrl} in your collection. Did you delete a previously registered page? Skipping`,
            ),
          );
          continue;
        }

        abortController.signal.addEventListener("abort", abortHandler);

        const dateTimeAtSnapshotLaunch = DateTime.local();

        const operationResult = await snapshotGenerator.captureSnapshot({
          abortSignal: abortController.signal,
          snapshotContext: _.defaults({}, item.context, { relevantTimeMin }),
          webPageDirPath,
          reportIssue: (message) =>
            output.write(chalk.yellow(`\n${progressPrefix}${message}`)),
          webPageUrl: item.webPageUrl,
          previousFailuresInSnapshotQueue,
        });

        if (abortController.signal.aborted) {
          return;
        }

        const serializedDuration = DateTime.local()
          .diff(dateTimeAtSnapshotLaunch)
          .toFormat("hh:mm:ss");

        await reportSnapshotQueueAttempts({
          attemptMessage: operationResult.message,
          attemptStartedAt,
          attemptStatus:
            operationResult.status === "processed" ? "succeeded" : "failed",
          snapshotGeneratorId,
          snapshotQueueItemIds: [item.id],
        });

        if (operationResult.status === "processed") {
          numberOfSucceededAttempts += 1;
          output.write(
            chalk.magenta(
              `\n${progressPrefix}Snapshot processed in ${serializedDuration}${
                operationResult.message ? `. ${operationResult.message}` : ""
              }`,
            ),
          );
        } else {
          previousFailuresInSnapshotQueue.push({
            webPageUrl: item.webPageUrl,
            message: operationResult.message,
          });
          output.write(
            chalk.red(
              `\n${progressPrefix}Snapshot failed in ${serializedDuration}${
                operationResult.message ? `. ${operationResult.message}` : ""
              }`,
            ),
          );
          numberOfFailedAttempts += 1;
          if (
            maxNumberOfFailedAttempts &&
            numberOfFailedAttempts === maxNumberOfFailedAttempts
          ) {
            break;
          }
        }

        if (snapshotGenerator.role === "local") {
          await syncCollectionIfNeeded({
            output,
            mode: "intermediate",
            message: `Process snapshot queue (${snapshotGenerator.name}, intermediate)`,
          });
        }

        abortController.signal.removeEventListener("abort", abortHandler);
      }
    } catch (error) {
      if (error instanceof AbortError && abortController.signal.aborted) {
        // noop
      } else {
        throw error;
      }
    }

    process.off("SIGINT", handleSigint);

    await snapshotGenerator.finishCaptureSnapshotBatch?.();

    if (!abortController.signal.aborted) {
      if (itemsToProcess.length > 0) {
        output.write("\n");
      }
      output.write(
        `\nDone. Attempts: ${numberOfAttempts} (${numberOfSucceededAttempts} succeeded, ${numberOfFailedAttempts} failed)\n`,
      );
      if (
        maxNumberOfFailedAttempts &&
        maxNumberOfFailedAttempts === numberOfFailedAttempts
      ) {
        output.write(
          chalk.red(
            `Processing stopped after reaching MAX_NUMBER_OF_FAILED_ATTEMPTS\n`,
          ),
        );
      }
    }

    if (snapshotGenerator.role === "local") {
      await syncCollectionIfNeeded({
        output,
        message: `Process snapshot queue (${snapshotGenerator.name})`,
      });
    }

    if (numberOfFailedAttempts > 0) {
      throw new ExitCodeError();
    }
  };
