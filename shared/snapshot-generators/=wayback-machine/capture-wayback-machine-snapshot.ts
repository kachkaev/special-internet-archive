import fs from "fs-extra";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sleep from "sleep-promise";

import { getCollectionDirPath } from "../../collection";
import { AbortError, getErrorMessage } from "../../errors";
import { CaptureSnapshot } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

const axiosInstance = createAxiosInstanceForWaybackMachine();

const maxRetryCount = 10;

const abortableSleep = async (
  timeout: number,
  abortSignal: AbortSignal | undefined,
) => {
  const tick = 100;
  for (let ttl = timeout; ttl > 0; ttl -= tick) {
    if (abortSignal?.aborted) {
      throw new AbortError();
    }
    await sleep(Math.min(ttl, tick));
  }
};

const mapRetryCountToDelay = (retryCount: number): number => {
  return (
    {
      /* eslint-disable @typescript-eslint/naming-convention */
      0: 0,
      1: 2000,
      2: 5000,
      3: 10_000,
      4: 10_000,
      5: 20_000,
      6: 20_000,
      /* eslint-enable @typescript-eslint/naming-convention */
    }[retryCount] ?? 30_000
  );
};

/**
 * Inspired by https://github.com/tgbot-collection/archiver/blob/e5996b5944fa33244a75dce883b5c80e9e92d50e/archiveOrg.go#L30-L38
 */
export const captureWaybackMachineSnapshot: CaptureSnapshot = async ({
  abortSignal,
  webPageUrl,
  reportIssue,
}) => {
  const formData = new URLSearchParams({
    url: webPageUrl,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    capture_all: "on",
  }).toString();

  for (let retryCount = 0; retryCount < maxRetryCount; retryCount += 1) {
    const retryDelay = mapRetryCountToDelay(retryCount);
    if (retryDelay > 0) {
      reportIssue?.(`Trying again in ${Math.floor(retryDelay / 1000)}s...`);
      await abortableSleep(retryDelay, abortSignal);
    }

    try {
      const res = await axiosInstance.post<string>(
        `https://web.archive.org/save/`,
        formData,
        {
          responseType: "text",
          timeout: 20_000,
          ...(abortSignal ? { signal: abortSignal } : {}),
        },
      );

      const html = res.data;

      if (html.includes("The server encountered an internal error")) {
        reportIssue?.("Wayback Machine server encountered an internal error.");
        continue;
      }

      // The host has been already captured 500 times today by this
      //  user account. Please email as at "info@archive.org" if you
      // would like to discuss this more.
      if (html.includes("by this user account")) {
        return {
          status: "failed",
          message:
            "API limits reached. Try using another internet connection or continue tomorrow.",
        };
      }

      const watchJobId = html.match(/spn\.watchJob\("([\w-]+)"/)?.[1];

      if (!watchJobId) {
        const tmpFilePath = path.resolve(
          getCollectionDirPath(),
          "snapshot-logs",
          "wayback-machine",
          `${randomUUID()}.txt`,
        );

        await fs.ensureDir(path.dirname(tmpFilePath));
        await fs.writeFile(tmpFilePath, html, "utf8");

        throw new Error(
          `Could not find watchJob id in Wayback Machine response. Response data saved to ${tmpFilePath}`,
        );
      }

      return {
        status: "processed",
        message: `Status: https://web.archive.org/save/status/${watchJobId}`,
      };
    } catch (error) {
      if (abortSignal?.aborted) {
        throw new AbortError();
      }

      reportIssue?.(getErrorMessage(error));
    }
  }

  return {
    status: "failed",
    message: `${maxRetryCount} retries exhausted`,
  };
};
