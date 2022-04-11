import { generateUpdateInventoryScript } from "../shared/generate-update-inventory-script";

const script = generateUpdateInventoryScript({
  defaultInventoryUpdateIntervalInMinutes: 5,
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
