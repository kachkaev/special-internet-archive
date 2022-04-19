export interface SnapshotInventoryItem {
  capturedAt: string;
  aliasUrl?: string;
}

export interface SnapshotInventory {
  updatedAt: string;
  items: SnapshotInventoryItem[];
}

// @todo Specify real annotation structure
export type WebPageAnnotation = {
  tempRelevantLinks?: string[];
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
