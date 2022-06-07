import { closePlaywrightBrowser } from "./=playwright/browser";
import { capturePlaywrightSnapshot } from "./=playwright/capture-playwright-snapshot";
import { extractPlaywrightSnapshotSummaryData } from "./=playwright/extract-playwright-snapshot-summary-data";
import { generatePlaywrightSnapshotFilePath } from "./=playwright/generate-playwright-snapshot-file-path";
import { obtainPlaywrightSnapshotTimes } from "./=playwright/obtain-playwright-snapshot-times";
import { ensureTraceViewerIsStopped } from "./=playwright/traces";
import { SnapshotGenerator } from "./types";

export const playwrightSnapshotGenerator: SnapshotGenerator = {
  aliasesSupported: false,
  captureSnapshot: capturePlaywrightSnapshot,
  checkIfSucceededSnapshotAttemptExpired: () => true,
  extractSnapshotSummaryData: extractPlaywrightSnapshotSummaryData,
  finishCaptureSnapshotBatch: closePlaywrightBrowser,
  finishExtractSnapshotSummaryDataBatch: ensureTraceViewerIsStopped,
  generateSnapshotFilePath: generatePlaywrightSnapshotFilePath,
  name: "Playwright",
  obtainSnapshotTimes: obtainPlaywrightSnapshotTimes,
  role: "local",
  snapshotQueueAttemptTimeoutInSeconds: 120,
};
