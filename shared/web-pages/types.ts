export interface WebPageDocument {
  documentType: "webPage";
  url: string;
  registeredAt: string;
  registeredVia: string;
  annotation: unknown; // @todo specify
  capturing: unknown; // @todo specify
  waybackMachine: unknown; // @todo specify
}
