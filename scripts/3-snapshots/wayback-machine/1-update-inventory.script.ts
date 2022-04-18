import { generateUpdateInventoryScript } from "../../shared/generate-update-snapshot-inventory-script";

const script = generateUpdateInventoryScript({
  output: process.stdout,
  snapshotGeneratorId: "waybackMachine",
});

await script();
