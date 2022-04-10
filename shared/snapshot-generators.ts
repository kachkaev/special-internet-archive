import { playwrightSnapshotGenerator } from "./snapshot-generators/=playwright";
import { waybackMachineSnapshotGenerator } from "./snapshot-generators/=wayback-machine";

export type { SnapshotContext } from "./snapshot-generators/types";

const snapshotGeneratorLookup = {
  playwright: playwrightSnapshotGenerator,
  waybackMachine: waybackMachineSnapshotGenerator,
};

export type SnapshotGeneratorId = keyof typeof snapshotGeneratorLookup;

export const getSnapshotGenerator = (id: SnapshotGeneratorId) => {
  return snapshotGeneratorLookup[id];
};
