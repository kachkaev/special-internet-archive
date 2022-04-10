export interface SnapshotInventoryItem {
  capturedAt: string;
  aliasUrl?: string;
}

export interface SnapshotInventory {
  updatedAt: string;
  items: SnapshotInventoryItem[];
}

export interface WebPageDocument {
  documentType: "webPage";
  url: string;
  registeredAt: string;
  registeredVia: string;
  annotation: unknown; // @todo specify
  snapshotInventoryLookup: Record<string, SnapshotInventory>;
}
