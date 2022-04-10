export type ObtainSnapshotTimes = (
  webPageUrl: string,
  aliasUrl?: string | undefined,
) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin?: string;
}

export type TakeSnapshot = (
  webPageUrl: string,
  snapshotPath: string,
  context: SnapshotContext,
) => Promise<void | string>;

export type CheckIfNewSnapshotIsDue = (
  webPageUrl: string,
  lastSnapshotMadeAt: string,
) => boolean | Promise<boolean>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  takeSnapshot?: TakeSnapshot;
}
