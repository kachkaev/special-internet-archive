import { OperationResult } from "../operations";

export interface SnapshotInventoryItem {
  capturedAt: string;
  aliasUrl?: string;
  statusCode?: 404; // property not set for 200 to reduce document size
}

export interface SnapshotInventory {
  updatedAt: string;
  items: SnapshotInventoryItem[];
}

// @todo Specify real annotation structure
export type WebPageAnnotation = {
  oldUrls?: string[];
  [key: string]: unknown;
};

export interface WebPageDocument {
  documentType: "webPage";
  webPageUrl: string;
  registeredAt: string;
  registeredVia: string;
  annotation: WebPageAnnotation;
  snapshotInventoryLookup: Record<string, SnapshotInventory>;
}

export type ProcessWebPagePayload = {
  progressPrefix: string;
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
};

export type ProcessWebPage = (
  payload: ProcessWebPagePayload,
) => OperationResult | Promise<OperationResult>;
