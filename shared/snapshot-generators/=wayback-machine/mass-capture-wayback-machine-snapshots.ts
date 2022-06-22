import * as envalid from "envalid";

import { cleanEnv } from "../../clean-env";
import { MassCaptureSnapshots } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

const axiosInstance = createAxiosInstanceForWaybackMachine();

type Response =
  | { error: string }
  | { digest: string; project: string; submitter: string; uuid: string };

export const massCaptureWaybackMachineSnapshots: MassCaptureSnapshots = async ({
  abortSignal,
  webPagesUrls,
}) => {
  const env = cleanEnv({
    // Wayback machine updates indexes faster if Isodos API is not used.
    // So it’s best to not mass-capture small numbers of snapshots.
    INTERNET_ARCHIVE_ISODOS_MIN_QUEUE_SIZE: envalid.num({ default: 1 }),
    INTERNET_ARCHIVE_ISODOS_PROJECT: envalid.str({ default: "" }),
    INTERNET_ARCHIVE_S3_ACCESS_KEY: envalid.str({ default: "" }),
    INTERNET_ARCHIVE_S3_SECRET_KEY: envalid.str({ default: "" }),
  });

  const isodosMinQueueSize = env.INTERNET_ARCHIVE_ISODOS_MIN_QUEUE_SIZE;
  const isodosProject = env.INTERNET_ARCHIVE_ISODOS_PROJECT;
  const s3AccessKey = env.INTERNET_ARCHIVE_S3_ACCESS_KEY;
  const s3SecretKey = env.INTERNET_ARCHIVE_S3_SECRET_KEY;

  if (!s3AccessKey || !s3SecretKey || !isodosProject) {
    return {
      status: "skipped",
      message: "Auth credentials not configured",
    };
  }

  if (webPagesUrls.length < isodosMinQueueSize && isodosMinQueueSize > 0) {
    return {
      status: "skipped",
      message: `Number of snapshots is less than ${isodosMinQueueSize}`,
    };
  }

  const res = await axiosInstance.post<Response>(
    `https://isodos.archive.org/api/batch/${isodosProject}`,
    webPagesUrls
      .map((webPageUrl) => JSON.stringify({ url: webPageUrl }))
      .join("\n"),
    {
      /* eslint-disable @typescript-eslint/naming-convention -- third-party API */
      headers: {
        Authorization: `LOW ${s3AccessKey}:${s3SecretKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      "axios-retry": { retries: 0 },
      timeout: 60_000,
      ...(abortSignal ? { signal: abortSignal } : {}),
      /* eslint-enable @typescript-eslint/naming-convention */
    },
  );

  if ("digest" in res.data) {
    return {
      status: "processed",
      message: `Captured with Isodos API. Digest: ${res.data.digest}, UUID: ${res.data.uuid}`,
    };
  }

  return {
    status: "processed",
    message: `Isodos API error: ${
      "error" in res.data ? res.data.error : JSON.stringify(res.data)
    }`,
  };
};
