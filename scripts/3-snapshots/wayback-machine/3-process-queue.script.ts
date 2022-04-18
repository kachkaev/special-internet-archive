import { generateProcessSnapshotQueueScript } from "../../shared/generate-process-snapshot-queue-script";

const script = generateProcessSnapshotQueueScript({
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
