export type MatchWebPageUrl = (webPageUrl: string) => boolean;
export type GenerateWebPageDirPath = (webPageUrl: string) => string;

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (payload: {
  webPageUrl: string;
  mostRecentSnapshotTime: string;
}) => string | undefined | Promise<string | undefined>;

export type CheckIfNewSnapshotIsDue = (payload: {
  webPageUrl: string;
  knownSnapshotTimesInAscOrder: string[];
}) => boolean | Promise<boolean>;

export interface WebPageVendor {
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
  matchWebPageUrl: MatchWebPageUrl;
}
