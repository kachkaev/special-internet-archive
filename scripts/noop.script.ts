import chalk from "chalk";
import * as envalid from "envalid";
import sleep from "sleep-promise";

import { cleanEnv } from "../shared/clean-env";

const script = async () => {
  const output = process.stdout;

  const env = cleanEnv({ TEST: envalid.str({ default: "000" }) });

  await sleep(1000);
  output.write(chalk.green(`hello ${env.TEST}\n`));
};

await script();
