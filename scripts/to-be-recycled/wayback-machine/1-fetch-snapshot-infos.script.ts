import axios from "axios";
import chalk from "chalk";
import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../../shared/clean-env";
import { relevantTimeMin } from "../../../shared/collection";
import { UserFriendlyError } from "../../../shared/errors";
import { serializeTime } from "../../../shared/helpers-for-json";
import { processWebPages } from "../../../shared/process-web-pages";
import {
  listWebPageAliases,
  writeWebPageDocument,
} from "../../../shared/web-pages";
import { WaybackMachineAliasInfo } from "../../../shared/web-pages/types";

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

const script = async () => {
  output.write(chalk.bold("Updating Wayback Machine snapshot inventory\n"));

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

      updatedWebPageDocument.waybackMachine ??= {};
      updatedWebPageDocument.waybackMachine.snapshotInfoByAlias ??= {};

      const minSerializedTimeToRefetch = serializeTime(
        DateTime.utc().minus({ minutes: inventoryUpdateIntervalInMinutes }),
      );

      for (const aliasUrl of aliasUrls) {
        const existingAliasInfo =
          webPageDocument.waybackMachine.snapshotInfoByAlias?.[aliasUrl];
        output.write(chalk.green(`\n  alias ${aliasUrl} `));

        if (
          existingAliasInfo &&
          existingAliasInfo.fetchedAt > minSerializedTimeToRefetch
        ) {
          output.write(
            chalk.gray(
              `fetching skipped; snapshot count: ${existingAliasInfo.snapshotTimes.length}`,
            ),
          );
          continue;
        }

        try {
          const aliasInfo: WaybackMachineAliasInfo = {
            fetchedAt: serializeTime(),
            snapshotTimes: await fetchSnapshotTimes(aliasUrl),
          };

          updatedWebPageDocument.waybackMachine.snapshotInfoByAlias[aliasUrl] =
            aliasInfo;

          if (
            _.isEqual(aliasInfo.snapshotTimes, existingAliasInfo?.snapshotTimes)
          ) {
            output.write(
              chalk.blue(
                `fetched; snapshot count: ${aliasInfo.snapshotTimes.length} (did not change)`,
              ),
            );
          } else {
            output.write(
              chalk.magenta(
                `fetched; snapshot count: ${
                  aliasInfo.snapshotTimes.length
                } (changed from ${
                  existingAliasInfo?.snapshotTimes.length ?? 0
                })`,
              ),
            );
          }
        } catch (error) {
          output.write(`${chalk.red(error)}  `);
        }
      }

      updatedWebPageDocument.waybackMachine.snapshotInfoByAlias = sortKeys(
        updatedWebPageDocument.waybackMachine.snapshotInfoByAlias,
      );

      await writeWebPageDocument(updatedWebPageDocument);
      output.write("\n");
    },
  });
};

await script();
