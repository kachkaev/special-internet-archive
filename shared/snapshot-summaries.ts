import path from "node:path";

import fs from "fs-extra";

import { writeFormattedJson } from "./json-formatting";

export interface TempRawVkPost {
  ad?: true;
  url: string;
  date: string;
  text: string;
}
export interface TempRawVkPhotoInAlbum {
  url: string;
  imageUrl: string;
}

/**
 * Property names are preliminary; the interface needs to be redesigned to support multiple web page sources.
 */
export interface SnapshotSummaryData {
  tempNumberOfFollowers?: number;
  tempPageDescription?: string;
  tempPageNotFound?: true;
  tempPageTitle?: string;
  tempPageTitleInfo?: string;
  tempPageVerified?: true;
  tempRawVkPosts?: TempRawVkPost[];
  tempRawVkPhotosInAlbum?: TempRawVkPhotoInAlbum[];
}

export type SnapshotSummaryCombinationData = SnapshotSummaryData;

export const snapshotSummaryStaleTime = "2022-09-15T10:10:00Z";
export const snapshotSummaryCombinationStaleTime = "2022-09-15T10:10:00Z";

export interface SnapshotSummaryDocument extends SnapshotSummaryData {
  documentType: "snapshotSummary";
  webPageUrl: string;
  aliasUrl?: string;
  capturedAt: string;
  extractedAt: string;
}

export interface SnapshotSummaryCombinationDocument
  extends SnapshotSummaryCombinationData {
  documentType: "snapshotSummaryCombination";
  webPageUrl: string;
  combinedAt: string;
}

const generateSnapshotSummaryDocumentPath = (
  snapshotOrSnapshotSummaryFilePath: string,
) => {
  return snapshotOrSnapshotSummaryFilePath.endsWith(".summary.json")
    ? snapshotOrSnapshotSummaryFilePath
    : `${snapshotOrSnapshotSummaryFilePath}.summary.json`;
};

export const readSnapshotSummaryDocument = async (
  snapshotOrSnapshotSummaryFilePath: string,
): Promise<SnapshotSummaryDocument> => {
  const rawJson = await fs.readFile(
    generateSnapshotSummaryDocumentPath(snapshotOrSnapshotSummaryFilePath),
    "utf8",
  );

  // https://github.com/microsoft/playwright/issues/16367
  if (rawJson.includes("�")) {
    throw new Error("Unexpected character � found in the summary");
  }

  return JSON.parse(rawJson) as SnapshotSummaryDocument;
};

export const writeSnapshotSummaryDocument = async (
  snapshotOrSnapshotSummaryFilePath: string,
  snapshotSummaryDocument: SnapshotSummaryDocument,
): Promise<void> => {
  await writeFormattedJson(
    generateSnapshotSummaryDocumentPath(snapshotOrSnapshotSummaryFilePath),
    snapshotSummaryDocument,
  );
};

const generateSnapshotSummaryCombinationDocumentPath = (
  webPageDirPath: string,
) => {
  return path.resolve(webPageDirPath, "snapshot-summary-combination.json");
};

export const readSnapshotSummaryCombinationDocument = async (
  webPageDirPath: string,
): Promise<SnapshotSummaryCombinationDocument | undefined> => {
  const filePath =
    generateSnapshotSummaryCombinationDocumentPath(webPageDirPath);

  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  return (await fs.readJson(
    generateSnapshotSummaryCombinationDocumentPath(webPageDirPath),
  )) as unknown as SnapshotSummaryCombinationDocument;
};

export const writeSnapshotSummaryCombinationDocument = async (
  webPageDirPath: string,
  snapshotSummaryCombinationDocument: SnapshotSummaryCombinationDocument,
): Promise<void> => {
  await writeFormattedJson(
    generateSnapshotSummaryCombinationDocumentPath(webPageDirPath),
    snapshotSummaryCombinationDocument,
  );
};
