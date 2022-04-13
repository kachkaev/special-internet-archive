import { obtainPlaywrightSnapshotTimes } from "./=playwright/obtain-playwright-snapshot-times";
import { takePlaywrightSnapshot } from "./=playwright/take-playwright-snapshot";
import { SnapshotGenerator } from "./types";

export const playwrightSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: false,
  name: "Playwright",
  snapshotAttemptTimeoutInSeconds: 120,
  takeSnapshot: takePlaywrightSnapshot,
  obtainSnapshotTimes: obtainPlaywrightSnapshotTimes,
};
