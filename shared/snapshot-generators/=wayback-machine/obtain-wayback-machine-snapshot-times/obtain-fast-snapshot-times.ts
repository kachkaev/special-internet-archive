import { Axios } from "axios";
import _ from "lodash";
import LRU from "lru-cache";

import { serializeTime } from "../../../time";
import { SnapshotInventoryItem } from "../../../web-page-documents";

const extractUrlPrefix = (url: string): string | undefined => {
  return (
    url.match(/^https:\/\/vk.com\/wall-?\d+/)?.[0] ??
    url.match(/^https:\/\/m.vk.com\/wall-?\d+/)?.[0]
  );
};

type TimeRecord = Pick<SnapshotInventoryItem, "capturedAt" | "statusCode">;
type ApiResponse = Array<[string, string, string]>;
type TimeRecordsByUrl = Record<string, TimeRecord[]>;

const cache = new LRU<string, TimeRecordsByUrl | Error>({ max: 5 });

/**
 * Method idea:
 *
 * 1. extract URL prefix if possible
 *
 * 2. Obtain and cache snapshot timestamps for all URLs given the prefix
 *
 * 3. Return snapshot times from cache
 */
export const obtainFastSnapshotTimes = async (
  url: string,
  axiosInstance: Axios,
): Promise<TimeRecord[] | undefined> => {
  const urlPrefix = extractUrlPrefix(url);
  if (!urlPrefix) {
    return;
  }

  if (!cache.has(urlPrefix)) {
    try {
      const { data } = await axiosInstance.get<ApiResponse>(
        "https://web.archive.org/web/timemap/json",
        {
          params: {
            url: urlPrefix,
            matchType: "prefix",
            output: "json",
            fl: "original,timestamp,statuscode",
            filter: "statuscode:200|404",
            limit: "1000000",
          },
          transitional: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
            silentJSONParsing: false, // Disables Object to string conversion if parsing fails
          },
        },
      );
      const timeRecordsByUrl: TimeRecordsByUrl = {};
      for (const [currentUrl, timestamp, rawStatusCode] of data.slice(
        1,
      ) /* header */) {
        const timeRecord: TimeRecord = { capturedAt: serializeTime(timestamp) };
        if (rawStatusCode === "404") {
          timeRecord.statusCode = 404;
        }
        timeRecordsByUrl[currentUrl] ??= [];
        timeRecordsByUrl[currentUrl]?.push(timeRecord);
      }
      cache.set(urlPrefix, timeRecordsByUrl);
    } catch (error) {
      cache.set(urlPrefix, error as Error);
    }
  }

  const urlGroupInventory = cache.get(urlPrefix);

  if (urlGroupInventory instanceof Error) {
    return undefined;
  }

  return _.orderBy(urlGroupInventory?.[url] ?? [], [
    (record) => record.capturedAt,
  ]);
};
