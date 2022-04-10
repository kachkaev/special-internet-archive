import chalk from "chalk";

import { getUrlInboxFilePath } from "../../shared/collection";
import { ensureFileExists } from "../shared/ensure-file-exists";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Ensuring URL inbox exists\n"));

  await ensureFileExists(getUrlInboxFilePath(), output);
};

await script();
