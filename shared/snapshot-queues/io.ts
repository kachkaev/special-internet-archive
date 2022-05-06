import fs from "fs-extra";
import _ from "lodash";
import path from "node:path";

import { getCollectionDirPath } from "../collection";
import { writeFormattedJson } from "../json-formatting";
import { SnapshotGeneratorId } from "../snapshot-generator-id";
import {
  SnapshotAttempt,
  SnapshotAttemptStatus,
  SnapshotQueueDocument,
} from "./types";

const generateSnapshotQueueDirPath = (): string => {
  return path.resolve(getCollectionDirPath(), "snapshot-queues");
};

export const generateSnapshotQueueDocumentPath = (
  snapshotGeneratorId: SnapshotGeneratorId,
) => {
  return path.resolve(
    generateSnapshotQueueDirPath(),
    `${_.kebabCase(snapshotGeneratorId)}.json`,
  );
};

export const readSnapshotQueueDocument = async (
  snapshotGeneratorId: SnapshotGeneratorId,
): Promise<SnapshotQueueDocument> => {
  const documentPath = generateSnapshotQueueDocumentPath(snapshotGeneratorId);

  if (!(await fs.pathExists(documentPath))) {
    return {
      documentType: "snapshotQueue",
      snapshotGeneratorId,
      items: [],
    };
  }

  const document = (await fs.readJson(documentPath)) as SnapshotQueueDocument;

  if (
    (document.documentType as unknown) !== "snapshotQueue" ||
    !Array.isArray(document.items) ||
    document.snapshotGeneratorId !== snapshotGeneratorId
  ) {
    throw new Error("Unexpected contents of ");
  }

  return document;
};

export const writeSnapshotQueueDocument = async (
  snapshotQueueDocument: SnapshotQueueDocument,
): Promise<void> => {
  const documentPath = generateSnapshotQueueDocumentPath(
    snapshotQueueDocument.snapshotGeneratorId,
  );

  const sortedItems = _.sortBy(
    snapshotQueueDocument.items,
    (item) => item.addedAt,
    (item) => item.webPageUrl,
  );

  await writeFormattedJson(documentPath, {
    ...snapshotQueueDocument,
    items: sortedItems,
  });
};

export const reportSnapshotQueueAttempts = async ({
  attemptMessage,
  attemptStartedAt,
  attemptStatus,
  snapshotGeneratorId,
  snapshotQueueItemIds,
}: {
  attemptMessage?: string | undefined;
  attemptStartedAt: string;
  attemptStatus: SnapshotAttemptStatus;
  snapshotGeneratorId: SnapshotGeneratorId;
  /** undefined is used when mass-capturing snapshots (all items are affected in the same manner) */
  snapshotQueueItemIds: string[];
}): Promise<void> => {
  const snapshotQueueDocument = await readSnapshotQueueDocument(
    snapshotGeneratorId,
  );

  const newSnapshotQueueDocument = _.cloneDeep(snapshotQueueDocument);

  const snapshotQueueItemIdsSet = new Set(snapshotQueueItemIds);

  const queueItems = newSnapshotQueueDocument.items.filter((item) =>
    snapshotQueueItemIdsSet.has(item.id),
  );
  if (queueItems.length === 0) {
    return;
  }

  for (const queueItem of queueItems) {
    queueItem.attempts ??= [];
    const newAttempt: SnapshotAttempt = {
      startedAt: attemptStartedAt,
      status: attemptStatus,
    };
    if (attemptMessage) {
      newAttempt.message = attemptMessage;
    }

    const existingAttemptIndex = queueItem.attempts.findIndex(
      (attempt) => attempt.startedAt === attemptStartedAt,
    );

    if (queueItem.attempts[existingAttemptIndex]?.status === "aborted") {
      return;
    }

    if (existingAttemptIndex !== -1) {
      queueItem.attempts.splice(existingAttemptIndex, 1, newAttempt);
    } else {
      queueItem.attempts.push(newAttempt);
    }
  }

  await writeSnapshotQueueDocument(newSnapshotQueueDocument);
};
