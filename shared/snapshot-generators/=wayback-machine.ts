import { unserializeTime } from "../time";
import { captureWaybackMachineSnapshot } from "./=wayback-machine/capture-wayback-machine-snapshot";
import { massCaptureWaybackMachineSnapshots } from "./=wayback-machine/mass-capture-wayback-machine-snapshots";
import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  captureSnapshot: captureWaybackMachineSnapshot,
  checkIfSucceededSnapshotAttemptExpired: (attempt) => {
    const snapshotAgeInSeconds = -unserializeTime(attempt.startedAt)
      .diffNow()
      .as("seconds");

    return attempt.message?.match(/isodos/i)
      ? snapshotAgeInSeconds > 60 * 60 * 24 * 1.5 // web.archive.org indexes are updated after a while when using Isodos
      : snapshotAgeInSeconds > 60 * 10; // 10 mins is typically enough when using web.archive.org/save
  },
  massCaptureSnapshots: massCaptureWaybackMachineSnapshots,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  role: "thirdParty",
  snapshotQueueAttemptTimeoutInSeconds: 30,
};
