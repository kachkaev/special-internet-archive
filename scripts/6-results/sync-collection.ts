import chalk from "chalk";

import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import { ExitCodeError } from "../../shared/errors";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Syncing archive collection\n"));

  const { status } = await syncCollectionIfNeeded({ output, mode: "forced" });
  if (status === "failed") {
    throw new ExitCodeError();
  }
};

await script();
