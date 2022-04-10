import fs from "fs-extra";

import { getErrorMessage } from "../errors";
import { serializeTime } from "../helpers-for-json";
import { OperationResult } from "../operations";
import { generateWebPageFilePath } from "./helpers";
import { writeWebPageDocument } from "./write-web-page-document";

export const registerWebPage = async (
  url: string,
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

  if (await fs.pathExists(webPageDocumentFilePath)) {
    return { status: "skipped" };
  }

  await writeWebPageDocument({
    documentType: "webPage",
    url,
    registeredAt: serializeTime(),
    registeredVia: "script:register-by-url",
    annotation: {},
    capturing: {},
    waybackMachine: {},
  });

  return { status: "processed" };
};
