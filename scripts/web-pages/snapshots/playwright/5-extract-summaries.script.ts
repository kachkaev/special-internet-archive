import { extractSnapshotSummariesScript } from "../shared/generate-extract-snapshot-summaries-script";

const script = extractSnapshotSummariesScript({
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
