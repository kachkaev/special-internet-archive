import { SnapshotGeneratorId } from "../snapshot-generator-id";
import { SnapshotContext } from "../snapshot-generators";

export type SnapshotAttemptStatus =
  | "aborted"
  | "failed"
  | "started"
  | "succeeded"
  | "timedOut";

export interface SnapshotAttempt<
  Status extends SnapshotAttemptStatus = SnapshotAttemptStatus,
> {
  startedAt: string;
  status: Status;
  message?: string;
}

export interface SnapshotQueueItem {
  id: string;
  webPageUrl: string;
  addedAt: string;
  context?: Partial<SnapshotContext>;
  attempts?: SnapshotAttempt[];
}

export interface SnapshotQueueDocument {
  documentType: "snapshotQueue";
  snapshotGeneratorId: SnapshotGeneratorId;
  items: SnapshotQueueItem[];
}
