import { generateComposeQueueScript } from "../shared/generate-compose-queue-script";

const script = generateComposeQueueScript({
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
