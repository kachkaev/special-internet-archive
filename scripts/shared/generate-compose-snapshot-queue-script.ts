import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { WriteStream } from "node:tty";

import { cleanEnv } from "../../shared/clean-env";
import { throwExitCodeErrorIfOperationFailed } from "../../shared/errors";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import {
  assertSnapshotGeneratorMatchesFilter,
  getSnapshotGenerator,
} from "../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  listKnownSnapshotTimesInAscOrder,
  readSnapshotQueueDocument,
  SnapshotAttempt,
  SnapshotQueueItem,
  writeSnapshotQueueDocument,
} from "../../shared/snapshot-queues";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";
import { skipWebPageBasedOnEnv } from "../../shared/web-page-documents/skip-web-page-based-on-env";
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
                seconds: snapshotGenerator.snapshotQueueAttemptTimeoutInSeconds,
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

    const operationResult = await processWebPages({
      output,
      processWebPage: async ({ webPageDirPath, webPageDocument }) => {
        const earlyResult = await skipWebPageBasedOnEnv({
          webPageDirPath,
          webPageDocument,
        });

        if (earlyResult) {
          const existingQueueItems = allExistingQueueItems.filter(
            (item) => item.webPageUrl === webPageDocument.webPageUrl,
          );
          allNewQueueItems.push(...existingQueueItems);

          return earlyResult;
        }

        const existingQueueItems = allExistingQueueItems.filter(
          (item) => item.webPageUrl === webPageDocument.webPageUrl,
        );

        if (
          existingQueueItems.some((item) =>
            item.attempts?.find((attempt) => attempt.status === "started"),
          )
        ) {
          allNewQueueItems.push(...existingQueueItems);

          return {
            status: "skipped",
            message: "there is a started snapshot attempt",
          };
        }

        const snapshotInventory =
          webPageDocument.snapshotInventoryLookup[snapshotGeneratorId];

        const snapshotInventoryUpdatedAt = snapshotInventory?.updatedAt;

        const queueItemsSucceededAfterInventoryUpdate =
          existingQueueItems.filter((item) => {
            const succeededAttemptTime = item.attempts?.find(
              (attempt) =>
                attempt.status === "succeeded" &&
                snapshotGenerator.checkIfSucceededSnapshotAttemptExpired(
                  attempt as SnapshotAttempt<"succeeded">, // @todo investigate the need for type casting
                ),
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
          webPageSnapshotQueueItems: queueItemsSucceededAfterInventoryUpdate,
        });

        const snapshotIsDue =
          force ||
          (await checkIfSnapshotIsDue({
            knownSnapshotTimesInAscOrder,
            snapshotGeneratorId,
            webPageDirPath,
            webPageDocument,
          }));

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

          allNewQueueItems.push(newQueueItem);

          return {
            status: "processed",
            message: "new snapshot is due",
          };
        }

        return {
          status: "skipped",
          message: "new snapshot is not due",
        };
      },
    });

    output.write(
      `Initial queue length: ${existingSnapshotQueueDocument.items.length}. New queue length: ${allNewQueueItems.length}.\n`,
    );

    await writeSnapshotQueueDocument({
      ...existingSnapshotQueueDocument,
      items: allNewQueueItems,
    });

    throwExitCodeErrorIfOperationFailed(operationResult);
  };
