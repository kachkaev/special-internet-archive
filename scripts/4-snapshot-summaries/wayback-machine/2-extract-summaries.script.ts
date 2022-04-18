import { generateExtractSnapshotSummariesScript } from "../../shared/generate-extract-snapshot-summaries-script";

const script = generateExtractSnapshotSummariesScript({
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
