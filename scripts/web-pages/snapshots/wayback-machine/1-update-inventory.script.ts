import { generateUpdateInventoryScript } from "../shared/generate-update-inventory-script";

const script = generateUpdateInventoryScript({
  defaultInventoryUpdateIntervalInMinutes: 10,
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
