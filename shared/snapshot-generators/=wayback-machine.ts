import sleep from "sleep-promise";

import { obtainWaybackMachineSnapshotTimes } from "./=wayback-machine/obtain-wayback-machine-snapshot-times";
import { SnapshotGenerator } from "./types";

export const waybackMachineSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: true,
  name: "Wayback Machine",
  obtainSnapshotTimes: obtainWaybackMachineSnapshotTimes,
  snapshotAttemptStaleIntervalInSeconds: 30,
  takeSnapshot: async () => {
    await sleep(100);
    throw new Error("Wayback Machine snapshots are not implemented yet");
  },
};
