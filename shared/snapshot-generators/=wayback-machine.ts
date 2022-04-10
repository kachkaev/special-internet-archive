import { checkIfNewWaybackMachineSnapshotIsDue } from "./=wayback-machine/check-if-new-wayback-machine-snapshot-is-due";
import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  checkIfNewSnapshotIsDue: checkIfNewWaybackMachineSnapshotIsDue,
};
