import { WriteStream } from "node:tty";

import { ReportIssue } from "../issues";
import { OperationResult } from "../operations";
import { SnapshotAttempt } from "../snapshot-queues";
import { SnapshotSummaryData } from "../snapshot-summaries";
import { SnapshotInventoryItem, WebPageDocument } from "../web-page-documents";

export type ObtainSnapshotTimes = (payload: {
  abortSignal?: AbortSignal;
  aliasUrl?: string | undefined;
  webPageDirPath: string;
  webPageUrl: string;
}) => Promise<SnapshotInventoryItem[]>;

export interface SnapshotContext {
  relevantTimeMin: string;
}

export interface PreviousFailuresInSnapshotQueue {
  message: string | undefined;
  webPageUrl: string;
}

/**
 * @returns OperationResult with error if this particular snapshot failed,
 *    but can continue.
 * @throws if unable to continue (e.g. if reached API limits)
 */
export type CaptureSnapshot = (payload: {
  abortSignal?: AbortSignal;
  reportIssue?: ReportIssue;
  snapshotContext: SnapshotContext;
  webPageDirPath: string;
  webPageUrl: string;
  previousFailuresInSnapshotQueue: PreviousFailuresInSnapshotQueue[];
}) => Promise<OperationResult>;

/**
 * Mass-captures the whole queue at once.
 * Possible for some third-party snapshot generators.
 * @returns OperationResult with "error" if this particular snapshot failed.
 *      If "skipped", the queue should be processed one by one via CaptureSnapshot.
 */
export type MassCaptureSnapshots = (payload: {
  abortSignal?: AbortSignal;
  reportIssue?: ReportIssue;
  webPagesUrls: string[];
}) => Promise<OperationResult>;

export type DownloadSnapshot = (
  payload: {
    webPageDirPath: string;
    webPageDocument: WebPageDocument;
  } & SnapshotInventoryItem,
) => Promise<OperationResult>;

export type GenerateSnapshotFilePath = (
  payload: {
    webPageDirPath: string;
  } & SnapshotInventoryItem,
) => string;

export type ExtractSnapshotSummaryData = (payload: {
  abortSignal?: AbortSignal;
  output?: WriteStream | undefined;
  snapshotFilePath: string;
}) => Promise<SnapshotSummaryData>;

export type FinishCaptureSnapshotBatch = () => void | Promise<void>;
export type FinishExtractSnapshotSummaryDataBatch = () => void | Promise<void>;

export type CheckIfSucceededSnapshotAttemptExpired = (
  attempt: SnapshotAttempt<"succeeded">,
) => boolean;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  captureSnapshot: CaptureSnapshot;
  checkIfSucceededSnapshotAttemptExpired: CheckIfSucceededSnapshotAttemptExpired;
  downloadSnapshot?: DownloadSnapshot;
  extractSnapshotSummaryData?: ExtractSnapshotSummaryData;
  finishCaptureSnapshotBatch?: FinishCaptureSnapshotBatch;
  finishExtractSnapshotSummaryDataBatch?: FinishExtractSnapshotSummaryDataBatch;
  generateSnapshotFilePath?: GenerateSnapshotFilePath;
  massCaptureSnapshots?: MassCaptureSnapshots;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  role: "local" | "thirdParty";
  snapshotQueueAttemptTimeoutInSeconds: number;
}
