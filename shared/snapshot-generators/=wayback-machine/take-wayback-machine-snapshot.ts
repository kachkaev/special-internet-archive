import fs from "fs-extra";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { getCollectionDirPath } from "../../collection";
import { TakeSnapshot } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

const axiosInstance = createAxiosInstanceForWaybackMachine();

/**
 * Inspired by https://github.com/tgbot-collection/archiver/blob/e5996b5944fa33244a75dce883b5c80e9e92d50e/archiveOrg.go#L30-L38
 */
export const takeWaybackMachineSnapshot: TakeSnapshot = async ({
  webPageUrl,
}) => {
  const formData = new URLSearchParams({
    url: webPageUrl,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    capture_all: "on",
  }).toString();

  const res = await axiosInstance.post<string>(
    `https://web.archive.org/save/`,
    formData,
    { responseType: "text" },
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
};
