import chalk from "chalk";
import * as envalid from "envalid";
import { execa, Options } from "execa";
import sleep from "sleep-promise";

import { cleanEnv } from "../../../shared/clean-env";

const output = process.stdout;

const execaOptions: Options = { stdio: "inherit", reject: false };

const script = async () => {
  output.write(chalk.bold(`Reconnecting WARP\n`));

  const env = cleanEnv({
    CONNECTED_INTERVAL_IN_MINUTES: envalid.num({
      default: 25,
    }),
    DISCONNECTED_INTERVAL_IN_MINUTES: envalid.num({
      default: 5,
    }),
  });

  const connectedIntervalInMinutes = env.CONNECTED_INTERVAL_IN_MINUTES;
  const disconnectedIntervalInMinutes = env.DISCONNECTED_INTERVAL_IN_MINUTES;

  for (;;) {
    output.write("Connecting... ");
    await execa("warp-cli", ["connect"], execaOptions);
    await execa("http", ["--print=b", "ipinfo.io"], execaOptions);

    output.write(`Waiting ${connectedIntervalInMinutes} min...`);
    await sleep(connectedIntervalInMinutes * 60 * 1000);
    output.write(` Done.\n`);

    output.write("Disconnecting... ");
    await execa("warp-cli", ["disconnect"], execaOptions);

    output.write(`Waiting ${disconnectedIntervalInMinutes} min...`);
    await sleep(disconnectedIntervalInMinutes * 60 * 1000);
    output.write(` Done.\n`);
  }
};

await script();
