export interface SnapshotSummaryDocument {
  documentType: "snapshotSummary";
  webPageUrl: string;
  capturedAt: string;
  extractedAt: string;
  data: unknown;
}

export interface SnapshotSummaryCombinationDocument {
  documentType: "snapshotSummaryCombination";
  webPageUrl: string;
  combinedAt: string;
  data: unknown;
}
