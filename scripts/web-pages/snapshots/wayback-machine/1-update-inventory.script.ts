import { generateUpdateSnapshotInventoryScript } from "../../../../shared/web-pages";

const script = generateUpdateSnapshotInventoryScript({
  defaultInventoryUpdateIntervalInMinutes: 10,
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
