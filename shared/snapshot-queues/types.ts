import { SnapshotContext, SnapshotGeneratorId } from "../snapshot-generators";

export type SnapshotAttemptStatus =
  | "completed"
  | "failed"
  | "aborted"
  | "started"
  | "timedOut";

export interface SnapshotAttempt {
  startedAt: string;
  status: SnapshotAttemptStatus;
  message?: string;
}

export interface SnapshotQueueItem {
  id: string;
  webPageUrl: string;
  addedAt: string;
  context?: SnapshotContext;
  attempts?: SnapshotAttempt[];
}

export interface SnapshotQueueDocument {
  documentType: "snapshotQueue";
  snapshotGeneratorId: SnapshotGeneratorId;
  items: SnapshotQueueItem[];
}
