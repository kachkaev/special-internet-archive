import { SnapshotContext, SnapshotGeneratorId } from "../snapshot-generators";

export type SnapshotAttemptStatus =
  | "completed"
  | "failed"
  | "interrupted"
  | "started"
  | "timedOut";

export interface SnapshotAttempt {
  attemptedAt: string;
  status: SnapshotAttemptStatus;
  message?: string;
}

export interface SnapshotQueueItem {
  webPageUrl: string;
  addedAt: string;
  context: SnapshotContext;
  attempts?: SnapshotAttempt;
}

export interface SnapshotQueueDocument {
  documentType: "snapshotQueue";
  snapshotGeneratorId: SnapshotGeneratorId;
  items: SnapshotQueueItem[];
}
