import chalk from "chalk";
import { WriteStream } from "node:tty";

import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";
import { readSnapshotQueueDocument } from "../../../../shared/snapshot-queues/io";

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

    const snapshotQueueDocument = await readSnapshotQueueDocument(
      snapshotGeneratorId,
    );

    output.write(
      `Initial queue length: ${snapshotQueueDocument.items.length}\n`,
    );
  };
