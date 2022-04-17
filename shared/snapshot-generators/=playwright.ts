import { capturePlaywrightSnapshot } from "./=playwright/capture-playwright-snapshot";
import { generatePlaywrightSnapshotFilePath } from "./=playwright/generate-playwright-snapshot-file-path";
import { obtainPlaywrightSnapshotTimes } from "./=playwright/obtain-playwright-snapshot-times";
import { parsePlaywrightSnapshot } from "./=playwright/parse-playwright-snapshot";
import { ensureTraceViewerServerIsStopped } from "./=playwright/traces";
import { SnapshotGenerator } from "./types";

export const playwrightSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: false,
  captureSnapshot: capturePlaywrightSnapshot,
  finishExtractSnapshotSummaryDataBatch: ensureTraceViewerServerIsStopped,
  generateSnapshotFilePath: generatePlaywrightSnapshotFilePath,
  name: "Playwright",
  obtainSnapshotTimes: obtainPlaywrightSnapshotTimes,
  extractSnapshotSummaryData: parsePlaywrightSnapshot,
  role: "internal",
  snapshotAttemptTimeoutInSeconds: 120,
};
