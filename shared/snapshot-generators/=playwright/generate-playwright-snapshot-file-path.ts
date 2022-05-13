import path from "node:path";

import { unserializeTime } from "../../time";
import { GenerateSnapshotFilePath } from "../types";

export const generatePlaywrightSnapshotFilePath: GenerateSnapshotFilePath = ({
  webPageDirPath,
  capturedAt,
  aliasUrl,
}) => {
  if (aliasUrl) {
    throw new Error(`Did not expect aliasUrl to be defined (${aliasUrl})`);
  }

  const serializedCapturedAt =
    unserializeTime(capturedAt).toFormat("yyyy-MM-dd-HHmmss");

  const result = path.resolve(
    webPageDirPath,
    "snapshots",
    `${serializedCapturedAt}z-playwright.zip`,
  );

  return result;
};
