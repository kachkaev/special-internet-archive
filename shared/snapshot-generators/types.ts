export type ObtainSnapshotTimes = (
  webPageUrl: string,
  aliasUrl?: string | undefined,
) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin?: string;
}

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (
  webPageUrl: string,
  mostRecentSnapshotTime: string,
) => string | Promise<string>;

export type CheckIfNewSnapshotIsDue = (
  webPageUrl: string,
  mostRecentSnapshotTime: string,
) => boolean | Promise<boolean>;

export type TakeSnapshot = (
  webPageUrl: string,
  context: SnapshotContext,
) => Promise<void | string>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  snapshotAttemptStaleIntervalInSeconds: number;
  takeSnapshot?: TakeSnapshot;
}
