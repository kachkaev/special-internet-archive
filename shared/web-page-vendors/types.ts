export type MatchWebPageUrl = (webPageUrl: string) => boolean;
export type GenerateWebPageDirPath = (webPageUrl: string) => string;

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (
  webPageUrl: string,
  mostRecentSnapshotTime: string,
) => string | undefined | Promise<string | undefined>;

export type CheckIfNewSnapshotIsDue = (
  webPageUrl: string,
  mostRecentSnapshotTime: string,
) => boolean | Promise<boolean>;

export interface WebPageVendor {
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
  matchWebPageUrl: MatchWebPageUrl;
}
