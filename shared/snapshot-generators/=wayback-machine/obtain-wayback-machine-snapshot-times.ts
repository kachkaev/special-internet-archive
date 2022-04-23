import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";

import { relevantTimeMin } from "../../collection";
import { serializeTime } from "../../time";
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
type AjaxApiResponse = {
  items?: Array<
    [
      encodedCaptureDate: number,
      captureStatusCode: number,
      somethingUnknown: number,
    ]
  >;
};

const axiosInstance = createAxiosInstanceForWaybackMachine();

export const obtainWaybackMachineSnapshotTimes: ObtainSnapshotTimes = async ({
  abortSignal,
  webPageUrl,
  aliasUrl,
}) => {
  const url = aliasUrl ?? webPageUrl;
  const result: string[] = [];

  const env = envalid.cleanEnv(process.env, {
    WAYBACK_MACHINE_SNAPSHOT_INVENTORY_API: envalid.str({
      choices: ["ajax", "cdx"],
      default: "ajax",
    }),
  });

  const useCdxApi = env.WAYBACK_MACHINE_SNAPSHOT_INVENTORY_API === "cdx";

  // CDX API is likely to provide outdated data (by a few days)
  if (useCdxApi) {
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
        timeout: 5000,
        ...(abortSignal ? { signal: abortSignal } : {}),
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
  } else {
    const yearMin = DateTime.fromISO(relevantTimeMin, { setZone: true }).year;
    const yearMax = DateTime.utc().year;

    for (let year = yearMin; year <= yearMax; year += 1) {
      const { data: ajaxApiResponse } =
        await axiosInstance.get<AjaxApiResponse>(
          "https://web.archive.org/__wb/calendarcaptures/2",
          {
            responseType: "json",
            transitional: {
              // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
              silentJSONParsing: false, // Disables Object to string conversion if parsing fails
            },
            params: { url, date: `${year}` },
            timeout: 5000,
            ...(abortSignal ? { signal: abortSignal } : {}),
          },
        );

      for (const [
        encodedCaptureDate,
        captureStatusCode,
      ] of ajaxApiResponse.items ?? []) {
        if (captureStatusCode !== 200) {
          continue;
        }

        const serializedTime = serializeTime(
          `${year}${`${encodedCaptureDate}`.padStart(
            "MMDDHHMMSS".length,
            "0",
          )}`,
        );

        if (serializedTime < relevantTimeMin) {
          continue;
        }

        result.push(serializedTime);
      }
    }
  }

  // Wayback Machine sometimes reports duplicate timestamps
  return _.uniq(result);
};
