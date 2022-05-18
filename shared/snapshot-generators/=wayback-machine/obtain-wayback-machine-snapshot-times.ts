import * as envalid from "envalid";
import _ from "lodash";
import { DateTime } from "luxon";

import { cleanEnv } from "../../clean-env";
import { relevantTimeMin } from "../../collection";
import { serializeTime, unserializeTime } from "../../time";
import { ObtainSnapshotTimes } from "../types";
import { obtainFastSnapshotTimes } from "./obtain-wayback-machine-snapshot-times/obtain-fast-snapshot-times";
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

  const env = cleanEnv({
    WAYBACK_MACHINE_SNAPSHOT_INVENTORY_API: envalid.str({
      choices: ["fast-ajax", "ajax", "cdx"],
      default: "fast-ajax",
    }),
  });

  const apiToUse = env.WAYBACK_MACHINE_SNAPSHOT_INVENTORY_API;

  // CDX API is likely to provide outdated data (by a few days)
  if (apiToUse === "cdx") {
    // E.g. http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live&output=json
    const { data: rawCdxApiResponse } = await axiosInstance.get<CdxApiResponse>(
      "https://web.archive.org/cdx/search/cdx",
      {
        responseType: "json",
        transitional: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
          silentJSONParsing: false, // Disables Object to string conversion if parsing fails
        },
        params: { url, output: "json" },
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
    if (apiToUse === "fast-ajax") {
      const fastSnapshotTimes = await obtainFastSnapshotTimes(
        url,
        axiosInstance,
      );
      if (fastSnapshotTimes) {
        return fastSnapshotTimes;
      }
    }

    const yearMin = unserializeTime(relevantTimeMin).year;
    const yearMax = DateTime.utc().year;

    for (let year = yearMin; year <= yearMax; year += 1) {
      const { data: ajaxApiResponse } =
        await axiosInstance.get<AjaxApiResponse>(
          "https://web.archive.org/__wb/calendarcaptures/2",
          {
            responseType: "json",
            transitional: {
              // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
              silentJSONParsing: false, // Disables Object to string conversion if parsing fails
            },
            params: { url, date: `${year}` },
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
