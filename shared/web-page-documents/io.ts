import fs from "fs-extra";
import path from "node:path";

import { writeFormattedJson } from "../helpers-for-json";
import { isUrl } from "../urls";
import { generateWebPageDirPath } from "../web-page-vendors";
import { WebPageDocument } from "./types";

export const generateWebPageFilePath = (url: string): string => {
  return path.resolve(generateWebPageDirPath(url), "web-page.json");
};

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
