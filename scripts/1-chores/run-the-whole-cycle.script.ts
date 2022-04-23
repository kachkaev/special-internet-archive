import chalk from "chalk";
import sleep from "sleep-promise";

import { UserFriendlyError } from "../../shared/errors";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold(`Running the whole cycle\n`));
  await sleep(100);
  throw new UserFriendlyError("Script not implemented yet");
};

await script();
