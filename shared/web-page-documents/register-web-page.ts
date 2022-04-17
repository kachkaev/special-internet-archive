import { getErrorMessage } from "../errors";
import { OperationResult } from "../operations";
import { serializeTime } from "../time";
import { generateWebPageDirPath } from "../web-page-sources";
import {
  checkIfWebPageDocumentExists,
  generateWebPageDocumentPath,
  writeWebPageDocument,
} from "./io";

export const registerWebPage = async (
  webPageUrl: string,
  via: string,
): Promise<OperationResult> => {
  let webPageDirPath: string;
  try {
    webPageDirPath = generateWebPageDirPath(webPageUrl);
  } catch (error) {
    return {
      status: "failed",
      message: getErrorMessage(error),
    };
  }

  if (await checkIfWebPageDocumentExists(webPageDirPath)) {
    return {
      status: "skipped",
      message: generateWebPageDocumentPath(webPageDirPath),
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
