import fs from "fs-extra";
import path from "node:path";

import { writeFormattedJson } from "../helpers-for-json";
import { isUrl } from "../urls";
import { generateWebPageDirPath } from "../web-page-sources";
import { WebPageDocument } from "./types";

export const generateWebPagePath = (webPageUrl: string): string => {
  return path.resolve(generateWebPageDirPath(webPageUrl), "web-page.json");
};

const resolveWebPageDocumentPath = (webPageUrlOrDocumentPath: string): string =>
  isUrl(webPageUrlOrDocumentPath)
    ? generateWebPagePath(webPageUrlOrDocumentPath)
    : webPageUrlOrDocumentPath;

export const checkIfWebPageDocumentExists = async (
  webPageUrlOrDocumentPath: string,
): Promise<boolean> => {
  try {
    return await fs.pathExists(
      resolveWebPageDocumentPath(webPageUrlOrDocumentPath),
    );
  } catch {
    return false;
  }
};

export const readWebPageDocument = async (
  webPageUrlOrDocumentPath: string,
): Promise<WebPageDocument> => {
  const filePath = resolveWebPageDocumentPath(webPageUrlOrDocumentPath);

  const fileContents = (await fs.readJson(filePath)) as unknown;

  return fileContents as WebPageDocument;
};

export const writeWebPageDocument = async (
  payload: WebPageDocument,
): Promise<void> => {
  await writeFormattedJson(generateWebPagePath(payload.webPageUrl), payload);
};
