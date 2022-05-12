import chalk from "chalk";

import { syncCollectionIfNeeded } from "../../shared/collection-syncing";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Syncing archive collection\n"));

  await syncCollectionIfNeeded({ output, mode: "forced" });
};

await script();
