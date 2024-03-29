import { WriteStream } from "node:tty";

import chalk from "chalk";
import * as envalid from "envalid";
import RegexParser from "regex-parser";

import { cleanEnv } from "./clean-env";
import { ExitCodeError } from "./errors";
import { SnapshotGeneratorId } from "./snapshot-generator-id";
import { playwrightSnapshotGenerator } from "./snapshot-generators/=playwright";
import { waybackMachineSnapshotGenerator } from "./snapshot-generators/=wayback-machine";
import { SnapshotGenerator } from "./snapshot-generators/types";

export type { SnapshotContext } from "./snapshot-generators/types";

const snapshotGeneratorLookup: Record<SnapshotGeneratorId, SnapshotGenerator> =
  {
    playwright: playwrightSnapshotGenerator,
    waybackMachine: waybackMachineSnapshotGenerator,
  };

export const getSnapshotGenerator = (
  id: SnapshotGeneratorId,
): SnapshotGenerator => {
  return snapshotGeneratorLookup[id];
};

export const assertSnapshotGeneratorMatchesFilter = ({
  output,
  snapshotGeneratorId,
}: {
  output: WriteStream;
  snapshotGeneratorId: SnapshotGeneratorId;
}) => {
  const env = cleanEnv({
    FILTER_SNAPSHOT_GENERATOR_ID: envalid.str({
      desc: "Regex to filter snapshot generators",
      default: "",
    }),
  });

  const filterSnapshotGeneratorIdRegex = env.FILTER_SNAPSHOT_GENERATOR_ID
    ? RegexParser(env.FILTER_SNAPSHOT_GENERATOR_ID)
    : undefined;

  if (
    filterSnapshotGeneratorIdRegex &&
    !filterSnapshotGeneratorIdRegex.test(snapshotGeneratorId)
  ) {
    output.write(
      chalk.gray(
        `Skipped because of FILTER_SNAPSHOT_GENERATOR_ID=${env.FILTER_SNAPSHOT_GENERATOR_ID}\n`,
      ),
    );
    throw new ExitCodeError(0);
  }
};
