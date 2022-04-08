import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import { DateTime } from "luxon";
import sortKeys from "sort-keys";

import {
  getWebPagesDirPath,
  relevantTimeMin,
} from "../../../shared/collection";
import { serializeTime } from "../../../shared/helpers-for-json";
import { processFiles } from "../../../shared/process-files";
import {
  listWebPageAliases,
  writeWebPageDocument,
} from "../../../shared/web-pages";
import {
  WaybackMachineAliasInfo,
  WebPageDocument,
} from "../../../shared/web-pages/types";

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

const script = async () => {
  output.write(chalk.bold("Fetching Wayback Machine snapshot infos\n"));

  await processFiles({
    fileSearchPattern: "**/*.(json)",
    fileSearchDirPath: getWebPagesDirPath(),
    filesNicknameToLog: "web pages",
    output,
    processFile: async (webPageDocumentFilePath, prefixLength) => {
      const webPageDocument = (await fs.readJson(
        webPageDocumentFilePath,
      )) as WebPageDocument;

      const aliasUrls = listWebPageAliases(webPageDocument.url);

      webPageDocument.waybackMachine ??= {};
      webPageDocument.waybackMachine.snapshotInfoByAlias ??= {};

      output.write(" ".repeat(prefixLength));

      const minSerializedTimeToRefetch = serializeTime(
        DateTime.utc().minus({ minutes: 5 }),
      );
      for (const aliasUrl of aliasUrls) {
        const existingSerializedTime =
          webPageDocument.waybackMachine.snapshotInfoByAlias[aliasUrl]
            ?.fetchedAt;

        if (
          existingSerializedTime &&
          existingSerializedTime > minSerializedTimeToRefetch
        ) {
          output.write(` ${aliasUrl} [-]  `);
          continue;
        }

        try {
          const aliasInfo: WaybackMachineAliasInfo = {
            fetchedAt: serializeTime(),
            snapshotTimestamps: [],
          };

          // E.g. http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live&output=json
          const { data: rawCdxApiResponse } = await axios.get<CdxApiResponse>(
            "https://web.archive.org/cdx/search/cdx",
            {
              responseType: "json",
              transitional: {
                // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
                silentJSONParsing: false, // Disables Object to string conversion if parsing fails
              },
              params: { url: aliasUrl, output: "json" },
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

            if (statusCode !== "200") {
              continue;
            }

            const timestamp = cells[1];
            const serializedTime = serializeTime(timestamp);
            if (serializedTime < relevantTimeMin) {
              continue;
            }

            aliasInfo.snapshotTimestamps.push(serializedTime);
          }

          webPageDocument.waybackMachine.snapshotInfoByAlias[aliasUrl] =
            aliasInfo;

          output.write(
            ` ${aliasUrl} [${aliasInfo.snapshotTimestamps.length}]  `,
          );
        } catch (error) {
          output.write(` ${aliasUrl} ${error as string}  `);
        }
      }

      webPageDocument.waybackMachine.snapshotInfoByAlias = sortKeys(
        webPageDocument.waybackMachine.snapshotInfoByAlias,
      );

      await writeWebPageDocument(webPageDocument);
      output.write("\n");
    },
  });
};

await script();
