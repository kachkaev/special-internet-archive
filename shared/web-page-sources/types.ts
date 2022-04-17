export type GenerateWebPageDirPath = (webPageUrl: string) => string;
export type AssertSourceUrl = (webPageUrl: string) => void;

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (payload: {
  webPageUrl: string;
  mostRecentSnapshotTime: string;
}) => string | undefined | Promise<string | undefined>;

export type CheckIfNewSnapshotIsDue = (payload: {
  webPageUrl: string;
  knownSnapshotTimesInAscOrder: string[];
}) => boolean | Promise<boolean>;

export interface WebPageSource {
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
  assertWebPageUrl: AssertSourceUrl;
}
