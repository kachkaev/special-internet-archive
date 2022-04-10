import axios from "axios";
import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../../../shared/clean-env";
import { relevantTimeMin } from "../../../../shared/collection";
import { UserFriendlyError } from "../../../../shared/errors";
import { serializeTime } from "../../../../shared/helpers-for-json";
import { processWebPages } from "../../../../shared/process-web-pages";
import {
  listWebPageAliases,
  writeWebPageDocument,
} from "../../../../shared/web-pages";
import {
  SnapshotInventory,
  SnapshotInventoryItem,
} from "../../../../shared/web-pages/types";

const output = process.stdout;

type CdxApiResponse = Array<
  [string, string, string, string, string, string, string]
>;

const expectedColumnsInCdxApiResponse: CdxApiResponse[number] = [
  "urlkey",
  "timestamp",
  "original",
  "mimetype",
  "statuscode",
  "digest",
  "length",
];

const fetchSnapshotTimes = async (url: string): Promise<string[]> => {
  const result: string[] = [];
  // E.g. http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live&output=json
  const { data: rawCdxApiResponse } = await axios.get<CdxApiResponse>(
    "https://web.archive.org/cdx/search/cdx",
    {
      responseType: "json",
      transitional: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
        silentJSONParsing: false, // Disables Object to string conversion if parsing fails
      },
      params: { url, output: "json" },
    },
  );

  const [csvHeaderCells, ...csvRows] = rawCdxApiResponse;

  if (
    csvRows.length > 0 &&
    !_.isEqual(expectedColumnsInCdxApiResponse, csvHeaderCells)
  ) {
    throw new Error(
      "Unexpected columns in CDX API response. API signature must have changed, scripts need updating.",
    );
  }

  for (const cells of csvRows) {
    const statusCode = cells[4];

    if (statusCode !== "200" && statusCode !== "404") {
      continue;
    }

    const timestamp = cells[1];
    const serializedTime = serializeTime(timestamp);
    if (serializedTime < relevantTimeMin) {
      continue;
    }

    result.push(serializedTime);
  }

  return result;
};

const calculateSnapshotCount = (
  snapshotInventoryItems: SnapshotInventoryItem[],
  aliasUrl?: string,
): number => {
  return _.filter(snapshotInventoryItems, (item) => item.aliasUrl === aliasUrl)
    .length;
};

const reportUpdateInSnapshots = (
  existingSnapshotInventory: SnapshotInventory | undefined,
  snapshotInventoryItems: SnapshotInventoryItem[],
  aliasUrl?: string,
) => {
  const count = calculateSnapshotCount(snapshotInventoryItems, aliasUrl);

  if (!existingSnapshotInventory) {
    output.write(chalk.magenta(`snapshot count: ${count}`));

    return;
  }

  const oldCount = calculateSnapshotCount(existingSnapshotInventory.items);
  if (oldCount === count) {
    output.write(`snapshot count: ${count}`);
  } else {
    output.write(`snapshot count: ${oldCount} → ${chalk.magenta(count)}`);
  }
};

const script = async () => {
  output.write(chalk.bold("Updating Wayback Machine snapshot inventory\n"));
  output.write(
    chalk.blue(
      `Only snapshots since ${relevantTimeMin} are taken into account.\n`,
    ),
  );

  const env = cleanEnv({
    INVENTORY_UPDATE_INTERVAL_IN_MINUTES: envalid.num({
      default: 10,
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
      const aliasUrls = listWebPageAliases(webPageDocument.url);

      const snapshotInventoryItems: SnapshotInventoryItem[] = [];

      const existingSnapshotInventory =
        updatedWebPageDocument.snapshotInventoryLookup["waybackMachine"];

      if (existingSnapshotInventory) {
        const minSerializedTimeToRefetch = serializeTime(
          DateTime.utc().minus({ minutes: inventoryUpdateIntervalInMinutes }),
        );
        if (existingSnapshotInventory.updatedAt > minSerializedTimeToRefetch) {
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

      const snapshotTimes = await fetchSnapshotTimes(webPageDocument.url);
      for (const snapshotTime of snapshotTimes) {
        snapshotInventoryItems.push({ capturedAt: snapshotTime });
      }

      reportUpdateInSnapshots(
        existingSnapshotInventory,
        snapshotInventoryItems,
      );

      for (const aliasUrl of aliasUrls) {
        output.write(`\n  alias ${chalk.underline(aliasUrl)} `);

        const aliasSnapshotTimes = await fetchSnapshotTimes(
          webPageDocument.url,
        );

        for (const aliasSnapshotTime of aliasSnapshotTimes) {
          snapshotInventoryItems.push({
            capturedAt: aliasSnapshotTime,
            aliasUrl,
          });
        }

        reportUpdateInSnapshots(
          existingSnapshotInventory,
          snapshotInventoryItems,
          aliasUrl,
        );
      }

      updatedWebPageDocument.snapshotInventoryLookup["waybackMachine"] = {
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

await script();
