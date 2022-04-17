import { WriteStream } from "node:tty";

export type ObtainSnapshotTimes = (payload: {
  webPageUrl: string;
  webPageDirPath: string;
  aliasUrl?: string | undefined;
}) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin?: string;
}

export type CaptureSnapshot = (payload: {
  abortSignal?: AbortSignal;
  output?: WriteStream | undefined;
  snapshotContext?: SnapshotContext | undefined;
  webPageDirPath: string;
  webPageUrl: string;
}) => Promise<void | string>;

export type ParseSnapshot = (payload: {
  abortSignal?: AbortSignal;
  output?: WriteStream | undefined;
  snapshotFilePath: string;
}) => Promise<void | string>;

export type FinishCaptureSnapshotBatch = () => void | Promise<void>;
export type FinishParseSnapshotBatch = () => void | Promise<void>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  parseSnapshot?: ParseSnapshot;
  snapshotAttemptTimeoutInSeconds: number;
  finishParseSnapshotBatch?: FinishParseSnapshotBatch;
  finishCaptureSnapshotBatch?: FinishCaptureSnapshotBatch;
  captureSnapshot: CaptureSnapshot;
}
