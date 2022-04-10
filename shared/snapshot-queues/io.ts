import fs from "fs-extra";
import _ from "lodash";
import path from "node:path";

import { getCollectionDirPath } from "../collection";
import { writeFormattedJson } from "../helpers-for-json";
import { SnapshotGeneratorId } from "../snapshot-generators";
import { SnapshotQueueDocument } from "./types";

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
