import chalk from "chalk";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../../../shared/errors";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Extracting snapshot summaries\n"));

  await sleep(500);
  throw new UserFriendlyError("Not implemented yet");
};

await script();