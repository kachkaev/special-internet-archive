import fs from "fs-extra";
import path from "node:path";

import { writeFormattedJson } from "../json-formatting";
import { WebPageDocument } from "./types";

export const generateWebPageDocumentPath = (webPageDirPath: string): string => {
  return path.resolve(webPageDirPath, "web-page.json");
};

export const checkIfWebPageDocumentExists = async (
  webPageDirPath: string,
): Promise<boolean> => {
  try {
    return await fs.pathExists(generateWebPageDocumentPath(webPageDirPath));
  } catch {
    return false;
  }
};

export const readWebPageDocument = async (
  webPageDirPath: string,
): Promise<WebPageDocument> => {
  const fileContents = (await fs.readJson(
    generateWebPageDocumentPath(webPageDirPath),
  )) as unknown;

  return fileContents as WebPageDocument;
};

export const writeWebPageDocument = async (
  webPageDirPath: string,
  webPageDocument: WebPageDocument,
): Promise<void> => {
  await writeFormattedJson(
    generateWebPageDocumentPath(webPageDirPath),
    webPageDocument,
  );
};
