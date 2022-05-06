import { captureWaybackMachineSnapshot } from "./=wayback-machine/capture-wayback-machine-snapshot";
import { massCaptureWaybackMachineSnapshots } from "./=wayback-machine/mass-capture-wayback-machine-snapshots";
import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  captureSnapshot: captureWaybackMachineSnapshot,
  massCaptureSnapshots: massCaptureWaybackMachineSnapshots,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  role: "thirdParty",
  snapshotAttemptTimeoutInSeconds: 30,
};
