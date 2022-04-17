import fs from "fs-extra";

import { writeFormattedJson } from "./helpers-for-json";

export type SnapshotSummaryData = unknown;
export type SnapshotSummaryCombinationData = SnapshotSummaryData;

export const snapshotSummaryStaleTime = "2022-01-01T00:00:00Z";

export interface SnapshotSummaryDocument {
  documentType: "snapshotSummary";
  webPageUrl: string;
  aliasUrl?: string;
  capturedAt: string;
  extractedAt: string;
  data: SnapshotSummaryData;
}

export interface SnapshotSummaryCombinationDocument {
  documentType: "snapshotSummaryCombination";
  webPageUrl: string;
  combinedAt: string;
  data: SnapshotSummaryData;
}

const generateSnapshotSummaryDocumentPath = (snapshotFilePath: string) => {
  return `${snapshotFilePath}.summary.json`;
};

export const checkIfSnapshotSummaryDocumentExists = async (
  snapshotFilePath: string,
): Promise<boolean> => {
  return await fs.pathExists(
    generateSnapshotSummaryDocumentPath(snapshotFilePath),
  );
};

export const readSnapshotSummaryDocument = async (
  snapshotFilePath: string,
): Promise<SnapshotSummaryDocument> => {
  return (await fs.readJson(
    generateSnapshotSummaryDocumentPath(snapshotFilePath),
  )) as unknown as SnapshotSummaryDocument;
};

export const writeSnapshotSummaryDocument = async (
  snapshotFilePath: string,
  snapshotSummaryDocument: SnapshotSummaryDocument,
): Promise<void> => {
  await writeFormattedJson(
    generateSnapshotSummaryDocumentPath(snapshotFilePath),
    snapshotSummaryDocument,
  );
};
