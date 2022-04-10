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
}) => Promise<void | string>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  snapshotAttemptTimeoutInSeconds: number;
  takeSnapshot: TakeSnapshot;
}
