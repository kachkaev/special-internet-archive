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
