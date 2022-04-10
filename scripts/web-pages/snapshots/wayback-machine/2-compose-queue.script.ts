import { generateSnapshotQueueScript } from "../../../../shared/web-pages";

const script = generateSnapshotQueueScript({
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
