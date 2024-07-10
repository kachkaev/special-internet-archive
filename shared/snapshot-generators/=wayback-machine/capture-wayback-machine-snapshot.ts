import { randomUUID } from "node:crypto";
import path from "node:path";

import axios from "axios";
import fs from "fs-extra";
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

const jobCheckDelayInSeconds: number = 3;

const mapRetryCountToDelay = (retryCount: number): number => {
  return (
    {
      /* eslint-disable @typescript-eslint/naming-convention */
      0: 0,
      1: 30_000,
      2: 5000,
      3: 5000,
      4: 5000,
      5: 5000,
      6: 5000,
      /* eslint-enable @typescript-eslint/naming-convention */
    }[retryCount] ?? 60_000
  );
};

const cannotResolveHostMessage = "Cannot resolve host";

const ipAddressBlocked =
  "Your IP address is blocked by Wayback Machine servers";

const urlBlocked = "URL is in the Save Page Now service block list";

const personalApiLimitsReachedMessage =
  "API limits reached. Try using another internet connection or continue tomorrow";

const urlLimitsReachedMessage =
  "Wayback Machine servers stopped crawling this URL for today. Try again tomorrow";

const crawlingPausedMessage =
  "Crawling this host is paused because they notified us that they are overloaded right now.";

const hostLimitsReachedMessage =
  "Wayback Machine servers stopped crawling this host for today. Try again tomorrow";

/**
 * Inspired by https://github.com/tgbot-collection/archiver/blob/e5996b5944fa33244a75dce883b5c80e9e92d50e/archiveOrg.go#L30-L38
 */
export const captureWaybackMachineSnapshot: CaptureSnapshot = async ({
  abortSignal,
  webPageUrl,
  reportIssue,
  previousFailuresInSnapshotQueue,
}) => {
  const webPageUrlObject = new URL(webPageUrl);

  const previousFailureMessage =
    previousFailuresInSnapshotQueue
      .filter(
        (failure) =>
          webPageUrlObject.hostname === new URL(failure.webPageUrl).hostname,
      )
      .map((failure) => failure.message)
      .find(
        (failureMessage) =>
          failureMessage === cannotResolveHostMessage ||
          failureMessage === crawlingPausedMessage ||
          failureMessage === hostLimitsReachedMessage ||
          failureMessage === ipAddressBlocked ||
          failureMessage === personalApiLimitsReachedMessage,
      ) ??
    previousFailuresInSnapshotQueue
      .filter((failure) => webPageUrl === failure.webPageUrl)
      .map((failure) => failure.message)
      .find((failureMessage) => failureMessage === urlBlocked);

  if (previousFailureMessage) {
    return { status: "skipped", message: previousFailureMessage };
  }

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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "axios-retry": { retries: 0 },
          validateStatus: (status) => status === 200 || status === 429,
          responseType: "text",
          timeout: 20_000,
          ...(abortSignal ? { signal: abortSignal } : {}),
        },
      );

      const html = res.data;

      if (
        res.status === 429 ||
        html.includes("The server encountered an internal error") ||
        html.includes("Too Many Requests")
      ) {
        reportIssue?.("Hitting Wayback Machine request rate limits");
        continue;
      }

      // Your IP address is in our block list. Please email us at "info@archive.org"
      // if you would like to discuss this more.
      if (html.includes("Your IP address is in our block list")) {
        return {
          status: "failed",
          message: ipAddressBlocked,
        };
      }

      // This URL is in the Save Page Now service block list and cannot be captured.
      // Please email us at "info@archive.org" if you would like to discuss this more.
      if (html.includes("Save Page Now service block list")) {
        return {
          status: "failed",
          message: urlBlocked,
        };
      }

      // Cannot resolve host %HOSTNAME%.
      if (html.includes("Cannot resolve host")) {
        return {
          status: "failed",
          message: cannotResolveHostMessage,
        };
      }

      // This host has been already captured 500 times today by this
      // user account. Please email us at "info@archive.org" if you
      // would like to discuss this more.
      if (html.includes("by this user account")) {
        return {
          status: "failed",
          message: personalApiLimitsReachedMessage,
        };
      }

      // This URL has been already captured 10 times today. Please try
      // again tomorrow. Please email us at "info@archive.org" if you
      // would like to discuss this more.
      if (html.includes("This URL has been already captured")) {
        return {
          status: "failed",
          message: urlLimitsReachedMessage,
        };
      }

      // This host has been already captured N00,000.0 times today. Please
      // try again tomorrow. Please email us at "info@archive.org" if you
      // would like to discuss this more.
      if (html.includes("This host has been already captured")) {
        return {
          status: "failed",
          message: hostLimitsReachedMessage,
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

      const watchJobUrl = `https://web.archive.org/save/status/${watchJobId}`;

      if (jobCheckDelayInSeconds > 0) {
        await abortableSleep(jobCheckDelayInSeconds * 1000, abortSignal);

        const { data } = await axios.get<Record<string, unknown>>(watchJobUrl, {
          responseType: "json",
          transitional: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
            silentJSONParsing: false, // Disables Object to string conversion if parsing fails
          },
        });

        if (data["status"] === "error") {
          return {
            status: "failed",
            message: `Status endpoint ${watchJobUrl} returned ${JSON.stringify(
              data,
            )}`,
          };
        }
      }

      return {
        status: "processed",
        message: `Status endpoint: ${watchJobUrl}`,
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
