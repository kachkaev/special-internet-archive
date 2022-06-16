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

/**
 * @returns reason for skipping (undefined means that the page should not be skipped)
 */
export type FindReasonToSkipWebPage = (
  payload: ProcessWebPagePayload,
) => string | undefined | Promise<string | undefined>;
