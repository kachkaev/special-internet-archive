import fs from "fs-extra";
import path from "node:path";

import { writeFormattedJson } from "./json-formatting";

export type SnapshotSummaryData = { tempRawVkPosts?: TempRawVkPost[] };
export type SnapshotSummaryCombinationData = SnapshotSummaryData;

export const snapshotSummaryStaleTime = "2022-04-21T00:00:00Z";
export const snapshotSummaryCombinationStaleTime = "2022-05-17T12:00:00Z";

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

export const checkIfSnapshotSummaryDocumentExists = async (
  snapshotOrSnapshotSummaryFilePath: string,
): Promise<boolean> => {
  return await fs.pathExists(
    generateSnapshotSummaryDocumentPath(snapshotOrSnapshotSummaryFilePath),
  );
};

export const readSnapshotSummaryDocument = async (
  snapshotOrSnapshotSummaryFilePath: string,
): Promise<SnapshotSummaryDocument> => {
  return (await fs.readJson(
    generateSnapshotSummaryDocumentPath(snapshotOrSnapshotSummaryFilePath),
  )) as unknown as SnapshotSummaryDocument;
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

export const checkIfSnapshotSummaryCombinationDocumentExists = async (
  webPageDirPath: string,
): Promise<boolean> => {
  return await fs.pathExists(
    generateSnapshotSummaryCombinationDocumentPath(webPageDirPath),
  );
};

export const readSnapshotSummaryCombinationDocument = async (
  webPageDirPath: string,
): Promise<SnapshotSummaryCombinationDocument> => {
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

export interface TempRawVkPost {
  url: string;
  date: string;
  text: string;
}
