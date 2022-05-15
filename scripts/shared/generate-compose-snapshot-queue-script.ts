import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { WriteStream } from "node:tty";

import { cleanEnv } from "../../shared/clean-env";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import {
  assertSnapshotGeneratorMatchesFilter,
  getSnapshotGenerator,
} from "../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  listKnownSnapshotTimesInAscOrder,
  readSnapshotQueueDocument,
  SnapshotQueueItem,
  writeSnapshotQueueDocument,
} from "../../shared/snapshot-queues";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";
import {
  calculateRelevantTimeMinForNewIncrementalSnapshot,
  checkIfSnapshotIsDue,
} from "../../shared/web-page-sources";

export const generateComposeSnapshotQueueScript =
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

    assertSnapshotGeneratorMatchesFilter({ output, snapshotGeneratorId });

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

    let numberOfStartedAttempts = 0;
    let numberOfTimedOutAttempts = 0;
    for (const existingQueueItem of allExistingQueueItems) {
      for (const attempt of existingQueueItem.attempts ?? []) {
        if (attempt.status === "started") {
          numberOfStartedAttempts += 1;

          if (
            serializeTime(
              DateTime.utc().minus({
                seconds: snapshotGenerator.snapshotAttemptTimeoutInSeconds,
              }),
            )
          ) {
            numberOfTimedOutAttempts += 1;
            attempt.status = "timedOut";
          }
        }
      }
    }

    if (numberOfStartedAttempts > 0) {
      output.write(
        chalk.yellow(
          `Number of already started snapshot attempts: ${numberOfStartedAttempts} (${numberOfTimedOutAttempts} are marked as timed out).\n`,
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
      handleSkippedWebPage: ({ webPageDocument }) => {
        const existingQueueItems = allExistingQueueItems.filter(
          (item) => item.webPageUrl === webPageDocument.webPageUrl,
        );
        allNewQueueItems.push(...existingQueueItems);
      },
      processWebPage: async ({ webPageDirPath, webPageDocument }) => {
        const existingQueueItems = allExistingQueueItems.filter(
          (item) => item.webPageUrl === webPageDocument.webPageUrl,
        );

        if (
          existingQueueItems.some((item) =>
            item.attempts?.find((attempt) => attempt.status === "started"),
          )
        ) {
          output.write(
            chalk.gray("skipping because there is a started snapshot attempt"),
          );
          allNewQueueItems.push(...existingQueueItems);

          return;
        }

        const snapshotInventory =
          webPageDocument.snapshotInventoryLookup[snapshotGeneratorId];

        const snapshotInventoryUpdatedAt = snapshotInventory?.updatedAt;

        const queueItemsSucceededAfterInventoryUpdate =
          existingQueueItems.filter((item) => {
            const succeededAttemptTime = item.attempts?.find(
              (attempt) => attempt.status === "succeeded",
            )?.startedAt;

            return (
              succeededAttemptTime &&
              (!snapshotInventoryUpdatedAt ||
                succeededAttemptTime > snapshotInventoryUpdatedAt)
            );
          });

        allNewQueueItems.push(...queueItemsSucceededAfterInventoryUpdate);

        const knownSnapshotTimesInAscOrder = listKnownSnapshotTimesInAscOrder({
          webPageSnapshotInventory: snapshotInventory,
          webPageSnapshotQueueItems: existingQueueItems,
        });

        const snapshotIsDue =
          force ||
          checkIfSnapshotIsDue({
            knownSnapshotTimesInAscOrder,
            snapshotGeneratorId,
            webPageDirPath,
            webPageDocument,
          });

        if (snapshotIsDue) {
          const newQueueItem: SnapshotQueueItem = {
            id: randomUUID(),
            webPageUrl: webPageDocument.webPageUrl,
            addedAt: newQueueItemAddedAt,
          };

          const mostRecentSnapshotTime = knownSnapshotTimesInAscOrder.at(-1);
          const relevantTimeMin =
            force || !mostRecentSnapshotTime
              ? undefined
              : await calculateRelevantTimeMinForNewIncrementalSnapshot({
                  mostRecentSnapshotTime,
                  webPageDirPath,
                  webPageDocument,
                  snapshotGeneratorId,
                });

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
