import { WriteStream } from "node:tty";

import { ReportIssue } from "../issues";
import { OperationResult } from "../operations";
import { SnapshotSummaryData } from "../snapshot-summaries";
import { SnapshotInventoryItem, WebPageDocument } from "../web-page-documents";

export type ObtainSnapshotTimes = (payload: {
  abortSignal?: AbortSignal;
  aliasUrl?: string | undefined;
  webPageDirPath: string;
  webPageUrl: string;
}) => Promise<string[]>;

export interface SnapshotContext {
  relevantTimeMin: string;
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

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  captureSnapshot: CaptureSnapshot;
  downloadSnapshot?: DownloadSnapshot;
  extractSnapshotSummaryData?: ExtractSnapshotSummaryData;
  finishCaptureSnapshotBatch?: FinishCaptureSnapshotBatch;
  finishExtractSnapshotSummaryDataBatch?: FinishExtractSnapshotSummaryDataBatch;
  generateSnapshotFilePath?: GenerateSnapshotFilePath;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
  role: "external" | "internal";
  snapshotAttemptTimeoutInSeconds: number;
}
