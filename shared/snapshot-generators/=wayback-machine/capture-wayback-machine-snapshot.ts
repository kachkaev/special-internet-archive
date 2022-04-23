import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import fs from "fs-extra";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sleep from "sleep-promise";

import { getCollectionDirPath } from "../../collection";
import { AbortError } from "../../errors";
import { CaptureSnapshot } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

const axiosInstance = createAxiosInstanceForWaybackMachine();

const maxRetryCount = 10;

const abortableSleep = async (
  timeout: number,
  abortSignal: AbortSignal | undefined,
) => {
  const tick = Math.min(timeout, 100);

  for (let ttl = timeout; ttl > 0; ttl -= tick) {
    if (abortSignal?.aborted) {
      throw new AbortError();
    }
    await sleep(tick);
  }
};

/**
 * Inspired by https://github.com/tgbot-collection/archiver/blob/e5996b5944fa33244a75dce883b5c80e9e92d50e/archiveOrg.go#L30-L38
 */
export const captureWaybackMachineSnapshot: CaptureSnapshot = async ({
  abortSignal,
  webPageUrl,
  output,
}) => {
  const formData = new URLSearchParams({
    url: webPageUrl,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    capture_all: "on",
  }).toString();

  for (let retryCount = 0; retryCount <= maxRetryCount; retryCount += 1) {
    if (retryCount === maxRetryCount) {
      throw new Error(`${maxRetryCount} retries exhausted`);
    }

    await abortableSleep(axiosRetry.exponentialDelay(retryCount), abortSignal);

    try {
      const res = await axiosInstance.post<string>(
        `https://web.archive.org/save/`,
        formData,
        {
          responseType: "text",
          timeout: 10_000,
          ...(abortSignal ? { signal: abortSignal } : {}),
        },
      );

      const html = res.data;
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

      return `Status: https://web.archive.org/save/status/${watchJobId}`;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        `${error.response?.data as string}`.includes(
          "The server encountered an internal error",
        )
      ) {
        output?.write(
          chalk.yellow(
            "\n  The server encountered an internal error, retrying...",
          ),
        );
        continue;
      }
    }
  }
};
