export type ObtainSnapshotTimes = (
  webPageUrl: string,
  aliasUrl?: string | undefined,
) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin?: string;
}

export type TakeSnapshot = (payload: {
  abortController?: AbortController;
  snapshotContext?: SnapshotContext | undefined;
  webPageUrl: string;
}) => Promise<undefined | string>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  snapshotAttemptStaleIntervalInSeconds: number;
  takeSnapshot: TakeSnapshot;
}
