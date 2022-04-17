import { obtainPlaywrightSnapshotTimes } from "./=playwright/obtain-playwright-snapshot-times";
import { parsePlaywrightSnapshot } from "./=playwright/parse-playwright-snapshot";
import { takePlaywrightSnapshot } from "./=playwright/take-playwright-snapshot";
import { ensureTraceViewerServerStopped } from "./=playwright/traces";
import { SnapshotGenerator } from "./types";

export const playwrightSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: false,
  name: "Playwright",
  obtainSnapshotTimes: obtainPlaywrightSnapshotTimes,
  parseSnapshot: parsePlaywrightSnapshot,
  snapshotAttemptTimeoutInSeconds: 120,
  finishParseSnapshotBatch: ensureTraceViewerServerStopped,
  captureSnapshot: takePlaywrightSnapshot,
};
