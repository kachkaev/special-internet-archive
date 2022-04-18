import _ from "lodash";

import { SnapshotInventory } from "../web-page-documents";
import { SnapshotQueueDocument } from "./types";

export const listSnapshotTimesInAscOrder = ({
  snapshotInventory,
  snapshotQueue,
}: {
  snapshotInventory: SnapshotInventory | undefined;
  snapshotQueue: SnapshotQueueDocument | undefined;
}): string[] => {
  const snapshotTimesInInventory = snapshotInventory?.items.map(
    (item) => item.capturedAt,
  );

  const snapshotTimesInSucceededQueueItems = snapshotQueue?.items
    .filter((item) =>
      item.attempts?.find((attempt) => attempt.status === "succeeded"),
    )
    .flatMap(
      (item) => item.attempts?.map((attempt) => attempt.startedAt) ?? [],
    );

  const knownSnapshotTimesInAscOrder = _.orderBy([
    ...(snapshotTimesInInventory ?? []),
    ...(snapshotTimesInSucceededQueueItems ?? []),
  ]);

  return knownSnapshotTimesInAscOrder;
};
