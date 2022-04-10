export type ObtainSnapshotTimes = (
  webPageUrl: string,
  aliasUrl?: string | undefined,
) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin?: string;
}

export type TakeSnapshot = (
  webPageUrl: string,
  context: SnapshotContext,
) => Promise<void | string>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  snapshotAttemptStaleIntervalInSeconds: number;
  takeSnapshot?: TakeSnapshot;
}
