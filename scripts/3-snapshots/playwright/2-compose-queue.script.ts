import { generateComposeSnapshotQueueScript } from "../../shared/generate-compose-snapshot-queue-script";

const script = generateComposeSnapshotQueueScript({
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
