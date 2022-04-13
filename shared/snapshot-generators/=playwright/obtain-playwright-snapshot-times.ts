import { globby } from "globby";
import path from "node:path";

import { serializeTime } from "../../time";
import { generateWebPageDirPath } from "../../web-page-vendors";
import { ObtainSnapshotTimes } from "../types";

export const obtainPlaywrightSnapshotTimes: ObtainSnapshotTimes = async (
  webPageUrl,
  aliasUrl,
) => {
  if (aliasUrl) {
    throw new Error(`Did not expect aliasUrl to be defined (${aliasUrl})`);
  }

  const snapshotFilePaths = await globby("snapshots/*-playwright.zip", {
    cwd: generateWebPageDirPath(webPageUrl),
    absolute: true,
    onlyFiles: true,
  });

  const result: string[] = [];
  for (const snapshotFilePath of snapshotFilePaths) {
    const snapshotFileName = path.basename(snapshotFilePath);
    const match = snapshotFileName.match(
      /^(\d{4})-(\d{2})-(\d{2})-(\d{6})z-playwright\.zip$/,
    );
    if (match) {
      result.push(serializeTime(match.slice(1).join("")));
    }
  }

  return result;
};
