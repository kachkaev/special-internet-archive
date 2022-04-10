import chalk from "chalk";
import { WriteStream } from "node:tty";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../errors";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "./snapshot-generators";

export const generateSnapshotQueueScript =
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

    await sleep(500);
    throw new UserFriendlyError("Not implemented yet");
  };
