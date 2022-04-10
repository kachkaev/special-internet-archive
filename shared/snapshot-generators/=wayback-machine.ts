import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { takeWaybackMachineSnapshot } from "./=wayback-machine/take-wayback-machine-snapshot";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  snapshotAttemptStaleIntervalInSeconds: 30,
  takeSnapshot: takeWaybackMachineSnapshot,
};
