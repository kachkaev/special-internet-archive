import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { takeWaybackMachineSnapshot } from "./=wayback-machine/take-wayback-machine-snapshot";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  captureSnapshot: takeWaybackMachineSnapshot,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  role: "internal",
  snapshotAttemptTimeoutInSeconds: 30,
};
