import { getErrorMessage } from "../errors";
import { serializeTime } from "../helpers-for-json";
import { OperationResult } from "../operations";
import {
  checkIfWebPageDocumentExists,
  generateWebPageFilePath,
  writeWebPageDocument,
} from "./io";

export const registerWebPage = async (
  url: string,
  via: string,
): Promise<OperationResult> => {
  let webPageDocumentFilePath: string;
  try {
    webPageDocumentFilePath = generateWebPageFilePath(url);
  } catch (error) {
    return {
      status: "failed",
      message: getErrorMessage(error),
    };
  }

  if (await checkIfWebPageDocumentExists(webPageDocumentFilePath)) {
    return { status: "skipped" };
  }

  await writeWebPageDocument({
    documentType: "webPage",
    url,
    registeredAt: serializeTime(),
    registeredVia: via,
    annotation: {},
    snapshotInventoryLookup: {},
  });

  return { status: "processed" };
};
