import { getErrorMessage } from "../errors";
import { OperationResult } from "../operations";
import { serializeTime } from "../time";
import {
  checkIfWebPageDocumentExists,
  generateWebPagePath,
  writeWebPageDocument,
} from "./io";

export const registerWebPage = async (
  webPageUrl: string,
  via: string,
): Promise<OperationResult> => {
  let webPageDocumentPath: string;
  try {
    webPageDocumentPath = generateWebPagePath(webPageUrl);
  } catch (error) {
    return {
      status: "failed",
      message: getErrorMessage(error),
    };
  }

  if (await checkIfWebPageDocumentExists(webPageDocumentPath)) {
    return { status: "skipped" };
  }

  await writeWebPageDocument({
    documentType: "webPage",
    webPageUrl,
    registeredAt: serializeTime(),
    registeredVia: via,
    annotation: {},
    snapshotInventoryLookup: {},
  });

  return { status: "processed" };
};
