import { generateProcessQueueScript } from "../shared/generate-process-queue-script";

const script = generateProcessQueueScript({
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
