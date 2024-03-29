import { WriteStream } from "node:tty";

import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../shared/clean-env";
import { relevantTimeMin } from "../../shared/collection";
import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import {
  throwExitCodeErrorIfOperationFailed,
  UserFriendlyError,
} from "../../shared/errors";
import { OperationResult } from "../../shared/operations";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import {
  assertSnapshotGeneratorMatchesFilter,
  getSnapshotGenerator,
} from "../../shared/snapshot-generators";
import {
  listKnownSnapshotTimesInAscOrder,
  readSnapshotQueueDocument,
} from "../../shared/snapshot-queues";
import { serializeTime } from "../../shared/time";
import {
  processWebPages,
  SnapshotInventory,
  SnapshotInventoryItem,
  writeWebPageDocument,
} from "../../shared/web-page-documents";
import { skipWebPageBasedOnEnv } from "../../shared/web-page-documents/skip-web-page-based-on-env";
import {
  checkIfNewSnapshotIsDue,
  listWebPageAliases,
} from "../../shared/web-page-sources";

const calculateSnapshotCount = (
  snapshotInventoryItems: SnapshotInventoryItem[],
  aliasUrl?: string,
): number => {
  return _.filter(snapshotInventoryItems, (item) => item.aliasUrl === aliasUrl)
    .length;
};

const reportUpdateInSnapshots = (
  output: WriteStream,
  existingSnapshotInventory: SnapshotInventory | undefined,
  snapshotInventoryItems: SnapshotInventoryItem[],
  aliasUrl?: string,
) => {
  const count = calculateSnapshotCount(snapshotInventoryItems, aliasUrl);

  if (!existingSnapshotInventory) {
    output.write(`snapshot count: ${chalk.magenta(count)}`);

    return;
  }

  const oldCount = calculateSnapshotCount(
    existingSnapshotInventory.items,
    aliasUrl,
  );

  if (oldCount === count) {
    output.write(`snapshot count: ${count}`);
  } else {
    output.write(`snapshot count: ${oldCount} ${chalk.magenta(`→ ${count}`)}`);
  }
};

const reportSkippedFetching = ({
  aliasUrls,
  existingSnapshotInventory,
  output,
  progressPrefix,
  reason,
}: {
  aliasUrls: string[];
  existingSnapshotInventory: SnapshotInventory;
  output: WriteStream;
  progressPrefix: string;
  reason: string;
}): OperationResult => {
  const mainUrlMessage = `snapshot count: ${calculateSnapshotCount(
    existingSnapshotInventory.items,
  )} - ${reason}`;

  if (aliasUrls.length === 0) {
    return {
      status: "skipped",
      message: mainUrlMessage,
    };
  }

  output.write(chalk.gray(mainUrlMessage));

  for (const aliasUrl of aliasUrls) {
    const aliasSnapshotCount = calculateSnapshotCount(
      existingSnapshotInventory.items,
      aliasUrl,
    );
    if (aliasSnapshotCount) {
      output.write(
        chalk.gray(
          `\n${progressPrefix}alias ${chalk.underline(
            aliasUrl,
          )} snapshot count: ${aliasSnapshotCount}`,
        ),
      );
    }
  }

  return {
    status: "skipped",
  };
};

export const generateUpdateInventoryScript =
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
      chalk.bold(`Updating ${snapshotGenerator.name} snapshot inventory\n`),
    );

    await syncCollectionIfNeeded({
      output,
      mode: "preliminary",
    });

    assertSnapshotGeneratorMatchesFilter({ output, snapshotGeneratorId });

    output.write(
      chalk.blue(
        `Only snapshots since ${relevantTimeMin} are taken into account.\n`,
      ),
    );

    let inventoryDurabilityInMinutes = 0;
    let eager = true;
    let updateAliases = true;

    let thereWasAtLeastOneAlias = false;

    if (snapshotGenerator.role === "thirdParty") {
      const env = cleanEnv({
        EAGER: envalid.bool({
          default: false,
        }),
        INVENTORY_DURABILITY_IN_MINUTES: envalid.num({
          default: 1200, // 20 hours
          desc: "Inventory durability in minutes",
        }),
        UPDATE_ALIASES: envalid.bool({
          default: false,
        }),
      });

      eager = env.EAGER;
      inventoryDurabilityInMinutes = env.INVENTORY_DURABILITY_IN_MINUTES;
      updateAliases = env.UPDATE_ALIASES;

      if (
        inventoryDurabilityInMinutes < 0 ||
        Math.round(inventoryDurabilityInMinutes) !==
          inventoryDurabilityInMinutes
      ) {
        throw new UserFriendlyError(
          "Expected INVENTORY_DURABILITY_IN_MINUTES to be a non-negative integer number",
        );
      }
    }

    const snapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );
    const existingSnapshotQueueItems = snapshotQueueDocument.items;

    const operationResult = await processWebPages({
      output,
      processWebPage: async ({
        progressPrefix,
        webPageDirPath,
        webPageDocument,
      }) => {
        const earlyResult = await skipWebPageBasedOnEnv({
          webPageDirPath,
          webPageDocument,
        });

        if (earlyResult) {
          return earlyResult;
        }

        const updatedWebPageDocument = _.cloneDeep(webPageDocument);
        const aliasUrls = snapshotGenerator.aliasesSupported
          ? listWebPageAliases(webPageDocument.webPageUrl)
          : [];

        if (aliasUrls.length > 0 && !thereWasAtLeastOneAlias) {
          thereWasAtLeastOneAlias = true;
        }

        const existingSnapshotInventory =
          updatedWebPageDocument.snapshotInventoryLookup[snapshotGeneratorId];

        if (existingSnapshotInventory) {
          const minSerializedTimeToRefetch = serializeTime(
            DateTime.utc().minus({ minutes: inventoryDurabilityInMinutes }),
          );
          if (
            existingSnapshotInventory.updatedAt > minSerializedTimeToRefetch
          ) {
            return reportSkippedFetching({
              aliasUrls,
              existingSnapshotInventory,
              output,
              progressPrefix,
              reason: `updated less than ${inventoryDurabilityInMinutes} min ago`,
            });
          }
        }

        if (!eager) {
          const webPageSnapshotQueueItems = existingSnapshotQueueItems.filter(
            (item) =>
              item.webPageUrl === webPageDocument.webPageUrl &&
              !item.attempts?.some((attempt) => attempt.status === "succeeded"),
          );

          const knownSnapshotTimesInAscOrder = listKnownSnapshotTimesInAscOrder(
            {
              webPageSnapshotInventory: existingSnapshotInventory,
              webPageSnapshotQueueItems,
            },
          );

          const mostRecentSnapshotTime = knownSnapshotTimesInAscOrder.at(-1);

          if (
            mostRecentSnapshotTime &&
            existingSnapshotInventory &&
            mostRecentSnapshotTime < existingSnapshotInventory.updatedAt &&
            !(await checkIfNewSnapshotIsDue({
              knownSnapshotTimesInAscOrder,
              snapshotGeneratorId,
              webPageDirPath,
              webPageDocument,
            }))
          ) {
            return reportSkippedFetching({
              aliasUrls,
              existingSnapshotInventory,
              output,
              progressPrefix,
              reason: `snapshot is not due`,
            });
          }
        }

        const snapshotInventoryItems: SnapshotInventoryItem[] = [];

        const snapshotTimes = await snapshotGenerator.obtainSnapshotTimes({
          webPageDirPath,
          webPageUrl: webPageDocument.webPageUrl,
        });

        snapshotInventoryItems.push(...snapshotTimes);

        reportUpdateInSnapshots(
          output,
          existingSnapshotInventory,
          snapshotInventoryItems,
        );

        for (const aliasUrl of aliasUrls) {
          if (!updateAliases) {
            const snapshotInventoryItemsForAlias =
              existingSnapshotInventory?.items.filter(
                (item) => item.aliasUrl === aliasUrl,
              );

            if (snapshotInventoryItemsForAlias?.length) {
              snapshotInventoryItems.push(...snapshotInventoryItemsForAlias);
            }
            const aliasSnapshotCount =
              snapshotInventoryItemsForAlias?.length ?? 0;
            if (aliasSnapshotCount) {
              output.write(
                chalk.gray(
                  `\n${progressPrefix}alias ${chalk.underline(
                    aliasUrl,
                  )} snapshot count: ${aliasSnapshotCount} - skipped`,
                ),
              );
            }
          } else {
            output.write(
              `\n${progressPrefix}alias ${chalk.underline(aliasUrl)} `,
            );

            const aliasSnapshotTimes =
              await snapshotGenerator.obtainSnapshotTimes({
                webPageDirPath,
                webPageUrl: webPageDocument.webPageUrl,
                aliasUrl,
              });

            for (const aliasSnapshotTime of aliasSnapshotTimes) {
              snapshotInventoryItems.push({
                aliasUrl,
                ...aliasSnapshotTime,
              });
            }

            reportUpdateInSnapshots(
              output,
              existingSnapshotInventory,
              snapshotInventoryItems,
              aliasUrl,
            );
          }
        }

        const orderedItems = _.orderBy(
          snapshotInventoryItems,
          (item) => item.capturedAt,
        );

        const needToUpdateDocument =
          snapshotGenerator.role === "thirdParty"
            ? true
            : !_.isEqual(
                orderedItems,
                updatedWebPageDocument.snapshotInventoryLookup[
                  snapshotGeneratorId
                ]?.items ?? [],
              );

        if (needToUpdateDocument) {
          updatedWebPageDocument.snapshotInventoryLookup[snapshotGeneratorId] =
            {
              updatedAt: serializeTime(),
              items: orderedItems,
            };
        }

        updatedWebPageDocument.snapshotInventoryLookup = sortKeys(
          updatedWebPageDocument.snapshotInventoryLookup,
        );

        if (!_.isEqual(webPageDocument, updatedWebPageDocument)) {
          await writeWebPageDocument(webPageDirPath, updatedWebPageDocument);
        }

        await syncCollectionIfNeeded({
          output,
          mode: "intermediate",
          message: `Update inventory (${snapshotGenerator.name}, intermediate)`,
        });

        return {
          status: "processed",
        };
      },
    });

    if (!updateAliases && (thereWasAtLeastOneAlias as boolean)) {
      output.write(
        chalk.blue(
          "Updating web page aliases is skipped by default to speed up the process. Use UPDATE_ALIASES=true to override that\n",
        ),
      );
    }
    if (!eager) {
      output.write(
        chalk.blue(
          "You may want to set EAGER=true to include web pages for which snapshots are not due yet\n",
        ),
      );
    }

    await syncCollectionIfNeeded({
      output,
      message: `Update inventory (${snapshotGenerator.name})`,
    });

    throwExitCodeErrorIfOperationFailed(operationResult);
  };
