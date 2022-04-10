import { generateUpdateInventoryScript } from "../shared/generate-update-inventory-script";

const script = generateUpdateInventoryScript({
  defaultInventoryUpdateIntervalInMinutes: 0,
  output: process.stdout,
  snapshotGeneratorId: "playwright",
});

await script();
