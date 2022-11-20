import path from "node:path";

import { globby } from "globby";

import { serializeTime } from "../../time";
import { SnapshotInventoryItem } from "../../web-page-documents";
import { ObtainSnapshotTimes } from "../types";

export const obtainPlaywrightSnapshotTimes: ObtainSnapshotTimes = async ({
  webPageDirPath,
  aliasUrl,
}) => {
  if (aliasUrl) {
    throw new Error(`Did not expect aliasUrl to be defined (${aliasUrl})`);
  }

  const snapshotFilePaths = await globby("snapshots/*-playwright.zip", {
    cwd: webPageDirPath,
    absolute: true,
    onlyFiles: true,
  });

  const result: SnapshotInventoryItem[] = [];
  for (const snapshotFilePath of snapshotFilePaths) {
    const snapshotFileName = path.basename(snapshotFilePath);
    const match = snapshotFileName.match(
      /^(\d{4})-(\d{2})-(\d{2})-(\d{6})z-playwright\.zip$/,
    );
    if (match) {
      result.push({
        capturedAt: serializeTime(match.slice(1).join("")),
        // @todo detect 404 or other status codes
      });
    }
  }

  return result;
};
