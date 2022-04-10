import chalk from "chalk";
import _ from "lodash";
import { WriteStream } from "node:tty";

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
        !item.attempts?.some((attempt) => attempt.status === "completed"),
    );

    output.write(chalk.green(`Items to process: ${itemsToProcess.length}\n`));

    const orderedItemsToProcess = _.orderBy(
      itemsToProcess,
      (item) => item.attempts?.at(-1)?.startedAt,
    );

    let numberOfAttempts = 0;
    let numberOfCompletedAttempts = 0;
    let numberOfFailedAttempts = 0;

    const abortController = new AbortController();
    let aborted = false as boolean;

    let abortHandler: (() => void) | undefined;

    process.on("SIGINT", () => {
      output.write(
        chalk.yellow("\n\nQueue processing was aborted with SIGINT.\n"),
      );
      abortController.abort();
      aborted = true;
      abortHandler?.();
    });

    for (const item of orderedItemsToProcess) {
      if (aborted) {
        break;
      }
      output.write(`\n${chalk.underline(item.webPageUrl)}`);

      output.write(
        chalk.green(`\n  Added to queue at: ${chalk.blue(item.addedAt)}`),
      );

      if (item.attempts?.length) {
        output.write(
          chalk.yellow(` previous attempts: ${item.attempts.length}`),
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

      abortHandler = () => {
        void reportSnapshotQueueAttempt({
          attemptStartedAt,
          attemptStatus: "aborted",
          snapshotGeneratorId,
          snapshotQueueItemId: item.id,
        });
      };

      try {
        const message = await snapshotGenerator.takeSnapshot({
          abortController,
          snapshotContext: item.context,
          webPageUrl: item.webPageUrl,
        });

        abortHandler = undefined;
        if (aborted as boolean) {
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
        abortHandler = undefined;
        if (aborted as boolean) {
          return;
        }

        const attemptMessage = getErrorMessage(error);
        output.write(chalk.red(`\n  Attempt Failed: ${attemptMessage}`));

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

    if (!aborted) {
      output.write(
        `\n\nDone. Attempts: ${numberOfAttempts} (${numberOfCompletedAttempts} completed, ${numberOfFailedAttempts} failed)\n`,
      );
    }
  };
