import chalk from "chalk";

import { ensureFileExists } from "../shared/ensure-file-exists";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Ensuring .env.local exists\n"));
  await ensureFileExists(".env.local", output);
};

await script();
