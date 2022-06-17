import { captureWaybackMachineSnapshot } from "./=wayback-machine/capture-wayback-machine-snapshot";
import { massCaptureWaybackMachineSnapshots } from "./=wayback-machine/mass-capture-wayback-machine-snapshots";
import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { checkIfWaybackMachineSucceededSnapshotAttemptExpired } from "./=wayback-machine/obtain-wayback-machine-snapshot-times/check-if-wayback-machine-succeeded-attempt-expired";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  captureSnapshot: captureWaybackMachineSnapshot,
  checkIfSucceededSnapshotAttemptExpired:
    checkIfWaybackMachineSucceededSnapshotAttemptExpired,
  massCaptureSnapshots: massCaptureWaybackMachineSnapshots,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  role: "thirdParty",
  snapshotQueueAttemptTimeoutInSeconds: 30,
};
