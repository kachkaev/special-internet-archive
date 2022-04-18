import _ from "lodash";

import { SnapshotInventory } from "../web-page-documents";
import { SnapshotQueueItem } from "./types";

export const listKnownSnapshotTimesInAscOrder = ({
  webPageSnapshotInventory,
  webPageSnapshotQueueItems,
}: {
  webPageSnapshotInventory: SnapshotInventory | undefined;
  webPageSnapshotQueueItems: SnapshotQueueItem[] | undefined;
}): string[] => {
  const snapshotTimesInInventory = webPageSnapshotInventory?.items.map(
    (item) => item.capturedAt,
  );

  const snapshotTimesInSucceededQueueItems = webPageSnapshotQueueItems
    ?.flatMap((item) => item.attempts ?? [])
    .filter((attempt) => attempt.status === "succeeded")
    .map((attempt) => attempt.startedAt);

  const knownSnapshotTimesInAscOrder = _.orderBy([
    ...(snapshotTimesInInventory ?? []),
    ...(snapshotTimesInSucceededQueueItems ?? []),
  ]);

  return knownSnapshotTimesInAscOrder;
};
