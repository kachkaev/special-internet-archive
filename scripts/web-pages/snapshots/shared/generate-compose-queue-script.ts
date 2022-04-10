import chalk from "chalk";
import envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { WriteStream } from "node:tty";

import { cleanEnv } from "../../../../shared/clean-env";
import { serializeTime } from "../../../../shared/helpers-for-json";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  readSnapshotQueueDocument,
  SnapshotQueueItem,
  writeSnapshotQueueDocument,
} from "../../../../shared/snapshot-queues";
import { processWebPages } from "../../../../shared/web-page-documents";
import {
  calculateRelevantTimeMinForNewIncrementalSnapshot,
  checkIfNewSnapshotIsDue,
} from "../../../../shared/web-page-vendors";

export const generateComposeQueueScript =
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
      chalk.bold(`Composing ${snapshotGenerator.name} snapshot queue\n`),
    );

    const env = cleanEnv({
      FORCE: envalid.bool({
        default: false,
      }),
    });
    const force = env.FORCE;
    output.write(
      force
        ? chalk.yellow(
            "Opted out of incremental mode by using FORCE=true. Full snapshots will be requested even if they were made recently.\n",
          )
        : "",
    );

    output.write(
      `${chalk.green(`Queue file:`)} ${generateSnapshotQueueDocumentPath(
        snapshotGeneratorId,
      )}\n`,
    );

    const existingSnapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );
    const allExistingQueueItems = _.cloneDeep(
      existingSnapshotQueueDocument.items,
    );

    let numberOfActiveAttempts = 0;
    let numberOfTimedOutAttempts = 0;
    for (const existingQueueItem of allExistingQueueItems) {
      for (const attempt of existingQueueItem.attempts ?? []) {
        if (attempt.status === "active") {
          numberOfActiveAttempts += 1;

          if (
            serializeTime(
              DateTime.utc().minus({
                seconds:
                  snapshotGenerator.snapshotAttemptStaleIntervalInSeconds,
              }),
            )
          ) {
            numberOfTimedOutAttempts += 1;
            attempt.status = "timedOut";
          }
        }
      }
    }

    if (numberOfActiveAttempts > 0) {
      output.write(
        chalk.yellow(
          `Number of already started snapshot attempts: ${numberOfActiveAttempts} (${numberOfTimedOutAttempts} are marked as timed out).\n`,
        ),
      );
      output.write(
        chalk.yellow(
          "This may happen because of an unexpected error during previous queue processing.\n",
        ),
      );
    }

    const allNewQueueItems: SnapshotQueueItem[] = [];
    const newQueueItemAddedAt = serializeTime();

    await processWebPages({
      output,
      handleSkippedWebPage: (webPageDocument) => {
        const existingQueueItems = allExistingQueueItems.filter(
          (item) => item.webPageUrl === webPageDocument.webPageUrl,
        );
        allNewQueueItems.push(...existingQueueItems);
      },
      processWebPage: async (webPageDocument) => {
        const existingQueueItems = allExistingQueueItems.filter(
          (item) => item.webPageUrl === webPageDocument.webPageUrl,
        );

        if (
          existingQueueItems.some((item) =>
            item.attempts?.find((attempt) => attempt.status === "active"),
          )
        ) {
          output.write(
            chalk.gray("skipping because there is an active snapshot attempt"),
          );
          allNewQueueItems.push(...existingQueueItems);

          return;
        }

        const snapshotInventory =
          webPageDocument.snapshotInventoryLookup[snapshotGeneratorId];

        const snapshotInventoryUpdatedAt = snapshotInventory?.updatedAt;

        const mostRecentSnapshotTimeInInventory = _.max(
          snapshotInventory?.items
            .filter((item) => !item.aliasUrl)
            .map((item) => item.capturedAt),
        );

        const queueItemsCompletedAfterInventoryUpdate =
          existingQueueItems.filter((item) => {
            const completedAttemptTime = item.attempts?.find(
              (attempt) => attempt.status === "completed",
            )?.attemptedAt;

            return (
              completedAttemptTime &&
              (!snapshotInventoryUpdatedAt ||
                completedAttemptTime > snapshotInventoryUpdatedAt)
            );
          });

        allNewQueueItems.push(...queueItemsCompletedAfterInventoryUpdate);

        const mostRecentlyCompletedQueueItem = _.orderBy(
          existingQueueItems.filter((item) =>
            item.attempts?.find((attempt) => attempt.status === "completed"),
          ),
          (item) => _.max(item.attempts?.map((attempt) => attempt.attemptedAt)),
        ).at(-1);

        const mostRecentSnapshotTime = _.max([
          mostRecentSnapshotTimeInInventory,
          mostRecentlyCompletedQueueItem?.attempts?.at(-1)?.attemptedAt,
        ]);

        const newSnapshotIsDue =
          force ||
          !mostRecentSnapshotTime ||
          checkIfNewSnapshotIsDue(
            webPageDocument.webPageUrl,
            mostRecentSnapshotTime,
          );

        if (newSnapshotIsDue) {
          const newQueueItem: SnapshotQueueItem = {
            webPageUrl: webPageDocument.webPageUrl,
            addedAt: newQueueItemAddedAt,
          };

          const relevantTimeMin =
            force || !mostRecentSnapshotTime
              ? undefined
              : await calculateRelevantTimeMinForNewIncrementalSnapshot(
                  webPageDocument.webPageUrl,
                  mostRecentSnapshotTime,
                );

          if (relevantTimeMin) {
            newQueueItem.context = {
              relevantTimeMin,
            };
          }

          output.write(chalk.magenta("new snapshot is due"));
          allNewQueueItems.push(newQueueItem);
        }
      },
    });

    output.write(
      `Initial queue length: ${existingSnapshotQueueDocument.items.length}. New queue length: ${allNewQueueItems.length}.\n`,
    );

    await writeSnapshotQueueDocument({
      ...existingSnapshotQueueDocument,
      items: allNewQueueItems,
    });
  };
