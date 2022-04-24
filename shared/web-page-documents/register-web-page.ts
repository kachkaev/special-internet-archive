import { getErrorMessage } from "../errors";
import { OperationResult } from "../operations";
import { serializeTime } from "../time";
import { generateWebPageDirPath } from "../web-page-sources";
import { generateWebPageDocumentPath, writeWebPageDocument } from "./io";

export const registerWebPage = async (
  webPageUrl: string,
  via: string,
  webPageDirPathLookup: Record<string, string>,
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

  await writeWebPageDocument(webPageDirPath, {
    documentType: "webPage",
    webPageUrl,
    registeredAt: serializeTime(),
    registeredVia: via,
    annotation: {},
    snapshotInventoryLookup: {},
  });

  return {
    status: "processed",
    message: generateWebPageDocumentPath(webPageDirPath),
  };
};
