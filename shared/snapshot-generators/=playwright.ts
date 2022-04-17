import { obtainPlaywrightSnapshotTimes } from "./=playwright/obtain-playwright-snapshot-times";
import { parsePlaywrightSnapshot } from "./=playwright/parse-playwright-snapshot";
import { takePlaywrightSnapshot } from "./=playwright/take-playwright-snapshot";
import { ensureTraceViewerServerStopped } from "./=playwright/traces";
import { SnapshotGenerator } from "./types";

export const playwrightSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: false,
  captureSnapshot: takePlaywrightSnapshot,
  finishParseSnapshotBatch: ensureTraceViewerServerStopped,
  name: "Playwright",
  obtainSnapshotTimes: obtainPlaywrightSnapshotTimes,
  parseSnapshot: parsePlaywrightSnapshot,
  role: "internal",
  snapshotAttemptTimeoutInSeconds: 120,
};
