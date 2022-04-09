import chalk from "chalk";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../../../../shared/user-friendly-error";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Processing Wayback Machine snapshot queue\n"));

  await sleep(500);
  throw new UserFriendlyError("Not implemented yet");
};

await script();
