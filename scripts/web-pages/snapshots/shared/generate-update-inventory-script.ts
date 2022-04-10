import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import { WriteStream } from "node:tty";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../../../shared/clean-env";
import { relevantTimeMin } from "../../../../shared/collection";
import { UserFriendlyError } from "../../../../shared/errors";
import { serializeTime } from "../../../../shared/helpers-for-json";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";
import {
  processWebPages,
  SnapshotInventory,
  SnapshotInventoryItem,
  writeWebPageDocument,
} from "../../../../shared/web-page-documents";
import { listWebPageAliases } from "../../../../shared/web-page-vendors";

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
    output.write(chalk.magenta(`snapshot count: ${count}`));

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

export const generateUpdateInventoryScript =
  ({
    defaultInventoryUpdateIntervalInMinutes,
    output,
    snapshotGeneratorId,
  }: {
    defaultInventoryUpdateIntervalInMinutes: number;
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

    const env = cleanEnv({
      INVENTORY_UPDATE_INTERVAL_IN_MINUTES: envalid.num({
        default: defaultInventoryUpdateIntervalInMinutes,
      }),
    });

    const inventoryUpdateIntervalInMinutes =
      env.INVENTORY_UPDATE_INTERVAL_IN_MINUTES;

    if (
      inventoryUpdateIntervalInMinutes < 0 ||
      Math.round(inventoryUpdateIntervalInMinutes) !==
        inventoryUpdateIntervalInMinutes
    ) {
      throw new UserFriendlyError(
        "Expected INVENTORY_UPDATE_INTERVAL_IN_MINUTES to be a non-negative integer number",
      );
    }

    await processWebPages({
      output,
      processWebPage: async (webPageDocument) => {
        const updatedWebPageDocument = _.cloneDeep(webPageDocument);
        const aliasUrls = snapshotGenerator.aliasesSupported
          ? listWebPageAliases(webPageDocument.url)
          : [];

        const snapshotInventoryItems: SnapshotInventoryItem[] = [];

        const existingSnapshotInventory =
          updatedWebPageDocument.snapshotInventoryLookup[snapshotGeneratorId];

        if (existingSnapshotInventory) {
          const minSerializedTimeToRefetch = serializeTime(
            DateTime.utc().minus({ minutes: inventoryUpdateIntervalInMinutes }),
          );
          if (
            existingSnapshotInventory.updatedAt > minSerializedTimeToRefetch
          ) {
            output.write(
              chalk.gray(
                `fetching skipped; snapshot count: ${calculateSnapshotCount(
                  existingSnapshotInventory.items,
                )}`,
              ),
            );

            for (const aliasUrl of aliasUrls) {
              output.write(
                chalk.gray(
                  `\n  alias ${chalk.underline(
                    aliasUrl,
                  )} snapshot count: ${calculateSnapshotCount(
                    existingSnapshotInventory.items,
                    aliasUrl,
                  )}`,
                ),
              );
            }

            return;
          }
        }

        const snapshotTimes = await snapshotGenerator.obtainSnapshotTimes(
          webPageDocument.url,
        );

        for (const snapshotTime of snapshotTimes) {
          snapshotInventoryItems.push({ capturedAt: snapshotTime });
        }

        reportUpdateInSnapshots(
          output,
          existingSnapshotInventory,
          snapshotInventoryItems,
        );

        for (const aliasUrl of aliasUrls) {
          output.write(`\n  alias ${chalk.underline(aliasUrl)} `);

          const aliasSnapshotTimes =
            await snapshotGenerator.obtainSnapshotTimes(
              webPageDocument.url,
              aliasUrl,
            );

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

        updatedWebPageDocument.snapshotInventoryLookup[snapshotGeneratorId] = {
          updatedAt: serializeTime(),
          items: _.orderBy(snapshotInventoryItems, (item) => item.capturedAt),
        };

        updatedWebPageDocument.snapshotInventoryLookup = sortKeys(
          updatedWebPageDocument.snapshotInventoryLookup,
        );

        await writeWebPageDocument(updatedWebPageDocument);
      },
    });
  };
