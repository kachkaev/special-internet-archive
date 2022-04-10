import { generateUpdateSnapshotInventoryScript } from "../../../../shared/web-pages";

const script = generateUpdateSnapshotInventoryScript({
  defaultInventoryUpdateIntervalInMinutes: 0,
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
