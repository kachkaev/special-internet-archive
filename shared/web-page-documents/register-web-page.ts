import fs from "fs-extra";

import { getErrorMessage } from "../errors";
import { OperationResult } from "../operations";
import { serializeTime } from "../time";
import { generateWebPageDirPath } from "../web-page-sources";
import { generateWebPageDocumentPath, writeWebPageDocument } from "./io";
import { WebPageAnnotation } from "./types";

export const registerWebPage = async (
  webPageUrl: string,
  via: string,
  webPageDirPathLookup: Record<string, string>,
  annotation: WebPageAnnotation = {},
): Promise<OperationResult> => {
  let webPageDirPath: string;

  const existingWebPageDirPath = webPageDirPathLookup[webPageUrl];
  if (existingWebPageDirPath) {
    return {
      status: "skipped",
      message: generateWebPageDocumentPath(existingWebPageDirPath),
    };
  }

  try {
    webPageDirPath = generateWebPageDirPath(webPageUrl);
  } catch (error) {
    return {
      status: "failed",
      message: getErrorMessage(error),
    };
  }

  const documentPath = generateWebPageDocumentPath(webPageDirPath);
  if (await fs.pathExists(documentPath)) {
    return {
      status: "failed",
      message: `Document already exists: ${documentPath}`,
    };
  }

  await writeWebPageDocument(webPageDirPath, {
    documentType: "webPage",
    webPageUrl,
    registeredAt: serializeTime(),
    registeredVia: via,
    annotation,
    snapshotInventoryLookup: {},
  });

  return {
    status: "processed",
    message: generateWebPageDocumentPath(webPageDirPath),
  };
};
