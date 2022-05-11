import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { WriteStream } from "node:tty";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../shared/clean-env";
import { relevantTimeMin } from "../../shared/collection";
import { UserFriendlyError } from "../../shared/errors";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import { getSnapshotGenerator } from "../../shared/snapshot-generators";
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
import {
  checkIfSnapshotIsDue,
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
}) => {
  output.write(
    chalk.gray(
      `snapshot count: ${calculateSnapshotCount(
        existingSnapshotInventory.items,
      )} - ${reason}`,
    ),
  );

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

    output.write(
      chalk.blue(
        `Only snapshots since ${relevantTimeMin} are taken into account.\n`,
      ),
    );

    let repeatIntervalInMinutes = 0;
    let eager = true;
    let updateAliases = true;

    let thereWasAtLeastOneAlias = false;

    if (snapshotGenerator.role === "thirdParty") {
      const env = cleanEnv({
        EAGER: envalid.bool({
          default: false,
        }),
        REPEAT_INTERVAL_IN_MINUTES: envalid.num({
          default: 5,
        }),
        UPDATE_ALIASES: envalid.bool({
          default: false,
        }),
      });

      eager = env.EAGER;
      repeatIntervalInMinutes = env.REPEAT_INTERVAL_IN_MINUTES;
      updateAliases = env.UPDATE_ALIASES;

      if (Math.round(repeatIntervalInMinutes) !== repeatIntervalInMinutes) {
        throw new UserFriendlyError(
          "Expected REPEAT_INTERVAL_IN_MINUTES to be a non-negative integer number",
        );
      }
    }

    const snapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );
    const existingSnapshotQueueItems = snapshotQueueDocument.items;

    await processWebPages({
      output,
      processWebPage: async ({
        progressPrefix,
        webPageDirPath,
        webPageDocument,
      }) => {
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
            DateTime.utc().minus({ minutes: repeatIntervalInMinutes }),
          );
          if (
            existingSnapshotInventory.updatedAt > minSerializedTimeToRefetch
          ) {
            reportSkippedFetching({
              aliasUrls,
              existingSnapshotInventory,
              output,
              progressPrefix,
              reason: `updated less than ${repeatIntervalInMinutes} min ago`,
            });

            return;
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
            !(await checkIfSnapshotIsDue({
              knownSnapshotTimesInAscOrder,
              snapshotGeneratorId,
              webPageDirPath,
              webPageDocument,
            }))
          ) {
            reportSkippedFetching({
              aliasUrls,
              existingSnapshotInventory,
              output,
              progressPrefix,
              reason: `snapshot is not due`,
            });

            return;
          }
        }

        const snapshotInventoryItems: SnapshotInventoryItem[] = [];

        const snapshotTimes = await snapshotGenerator.obtainSnapshotTimes({
          webPageDirPath,
          webPageUrl: webPageDocument.webPageUrl,
        });

        for (const snapshotTime of snapshotTimes) {
          snapshotInventoryItems.push({ capturedAt: snapshotTime });
        }

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
                capturedAt: aliasSnapshotTime,
                aliasUrl,
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

        if (
          snapshotGenerator.role === "thirdParty" ||
          !_.isEqual(
            orderedItems,
            updatedWebPageDocument.snapshotInventoryLookup[snapshotGeneratorId]
              ?.items,
          )
        ) {
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
      },
    });

    if (!updateAliases && (thereWasAtLeastOneAlias as boolean)) {
      output.write(
        chalk.blue(
          "Updating web page aliases is skipped by default to speed up the process. Use UPDATE_ALIASES=true to override that. You may also want to set EAGER=true to include web pages for which snapshots are not due yet.\n",
        ),
      );
    }
  };
