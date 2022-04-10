import fs from "fs-extra";
import path from "node:path";

import { writeFormattedJson } from "../helpers-for-json";
import { isUrl } from "../urls";
import { generateWebPageDirPath } from "../web-page-vendors";
import { WebPageDocument } from "./types";

export const generateWebPagePath = (url: string): string => {
  return path.resolve(generateWebPageDirPath(url), "web-page.json");
};

const resolveWebPageDocumentPath = (urlOrFilePath: string): string =>
  isUrl(urlOrFilePath) ? generateWebPagePath(urlOrFilePath) : urlOrFilePath;

export const checkIfWebPageDocumentExists = async (
  urlOrFilePath: string,
): Promise<boolean> => {
  try {
    return await fs.pathExists(resolveWebPageDocumentPath(urlOrFilePath));
  } catch {
    return false;
  }
};

export const readWebPageDocument = async (
  urlOrFilePath: string,
): Promise<WebPageDocument> => {
  const filePath = resolveWebPageDocumentPath(urlOrFilePath);

  const fileContents = (await fs.readJson(filePath)) as unknown;

  return fileContents as WebPageDocument;
};

export const writeWebPageDocument = async (
  payload: WebPageDocument,
): Promise<void> => {
  await writeFormattedJson(generateWebPagePath(payload.url), payload);
};
