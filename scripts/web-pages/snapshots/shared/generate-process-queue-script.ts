import chalk from "chalk";
import { WriteStream } from "node:tty";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../../../../shared/errors";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";

export const generateProcessQueueScript =
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
      chalk.bold(`Processing ${snapshotGenerator.name} snapshot queue\n`),
    );

    await sleep(500);

    throw new UserFriendlyError("Not implemented yet");
  };
