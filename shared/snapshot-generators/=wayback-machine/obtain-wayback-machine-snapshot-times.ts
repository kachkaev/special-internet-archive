import _ from "lodash";

import { relevantTimeMin } from "../../collection";
import { serializeTime } from "../../helpers-for-json";
import { ObtainSnapshotTimes } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

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

const axiosInstance = createAxiosInstanceForWaybackMachine();

export const obtainWaybackMachineSnapshotTimes: ObtainSnapshotTimes = async (
  webPageUrl,
  aliasUrl,
) => {
  const url = aliasUrl ?? webPageUrl;
  const result: string[] = [];
  // E.g. http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live&output=json
  const { data: rawCdxApiResponse } = await axiosInstance.get<CdxApiResponse>(
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

  // Wayback Machine sometimes reports duplicate timestamps
  return _.uniq(result);
};
