import fs from "fs-extra";

import { writeFormattedJson } from "../helpers-for-json";
import { isUrl } from "../urls";
import { generateWebPageFilePath } from "./helpers";
import { WebPageDocument } from "./types";

const resolveWebDocumentFilePath = (urlOrFilePath: string): string =>
  isUrl(urlOrFilePath) ? generateWebPageFilePath(urlOrFilePath) : urlOrFilePath;

export const checkIfWebPageDocumentExists = async (
  urlOrFilePath: string,
): Promise<boolean> => {
  try {
    return await fs.pathExists(resolveWebDocumentFilePath(urlOrFilePath));
  } catch {
    return false;
  }
};

export const readWebPageDocument = async (
  urlOrFilePath: string,
): Promise<WebPageDocument> => {
  const filePath = resolveWebDocumentFilePath(urlOrFilePath);

  const fileContents = (await fs.readJson(filePath)) as unknown;

  return fileContents as WebPageDocument;
};

export const writeWebPageDocument = async (
  payload: WebPageDocument,
): Promise<void> => {
  await writeFormattedJson(generateWebPageFilePath(payload.url), payload);
};
