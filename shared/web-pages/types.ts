export interface WaybackMachineAliasInfo {
  fetchedAt: string;
  snapshotTimestamps: string[];
}

export interface WaybackMachineInfo {
  snapshotInfoByAlias?: Record<string, WaybackMachineAliasInfo>;
}

export interface WebPageDocument {
  documentType: "webPage";
  url: string;
  registeredAt: string;
  registeredVia: string;
  annotation: unknown; // @todo specify
  capturing: unknown; // @todo specify
  waybackMachine: WaybackMachineInfo;
}
