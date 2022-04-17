import chalk from "chalk";
import { WriteStream } from "node:tty";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../../../../shared/errors";
import {
  getSnapshotGenerator,
  SnapshotGeneratorId,
} from "../../../../shared/snapshot-generators";

export const extractSnapshotSummariesScript =
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
      chalk.bold(`Extracting ${snapshotGenerator.name} snapshot summaries\n`),
    );

    await sleep(100);

    throw new UserFriendlyError("Not implemented yet");
  };
