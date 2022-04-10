import chalk from "chalk";
import _ from "lodash";
import { WriteStream } from "node:tty";

import { serializeTime } from "../../../../shared/helpers-for-json";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";
import {
  generateSnapshotQueueDocumentPath,
  readSnapshotQueueDocument,
  writeSnapshotQueueDocument,
} from "../../../../shared/snapshot-queues";

export const generateComposeQueueScript =
  ({
    output,
    snapshotGeneratorId,
  }: {
    output: WriteStream;
    snapshotGeneratorId: SnapshotGeneratorId;
  }) =>
  async () => {
    const snapshotGenerator = getSnapshotGenerator(snapshotGeneratorId);

    output.write(
      chalk.bold(`Composing ${snapshotGenerator.name} snapshot queue\n`),
    );

    output.write(
      `${chalk.green(`Queue file:`)} ${generateSnapshotQueueDocumentPath(
        snapshotGeneratorId,
      )}\n`,
    );

    const existingSnapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );
    const snapshotQueueDocument = _.cloneDeep(existingSnapshotQueueDocument);

    snapshotQueueDocument.items.push({
      addedAt: serializeTime(),
      webPageUrl: "TODO",
    });

    output.write(
      `Initial queue length: ${existingSnapshotQueueDocument.items.length}. New queue length: ${snapshotQueueDocument.items.length}.\n`,
    );

    await writeSnapshotQueueDocument(snapshotQueueDocument);
  };
