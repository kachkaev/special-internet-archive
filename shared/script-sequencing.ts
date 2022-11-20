import { WriteStream } from "node:tty";

import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import { DateTime } from "luxon";

import { AbortError, ExitCodeError } from "./errors";

export interface ScriptSequenceItem {
  scriptFilePath: string;
  continueOnError?: boolean;
}

export const runScriptSequence = async ({
  items,
  output,
}: {
  items: ScriptSequenceItem[];
  output: WriteStream;
}) => {
  const dateTimeAtSequenceLaunch = DateTime.local();

  for (const item of items) {
    if (!(await fs.pathExists(item.scriptFilePath))) {
      throw new Error(`Found non-existing script: ${item.scriptFilePath}`);
    }
  }

  const outputLocalTime = (color = chalk.blue) => {
    output.write(
      color(
        chalk.inverse(`Local time ${DateTime.local().toFormat("HH:mm:ss")}\n`),
      ),
    );
  };

  output.write("\n");

  const abortController = new AbortController();

  const handleSigint = () => {
    abortController.abort();
  };
  process.on("SIGINT", handleSigint);

  const finalizeSequence = (color = chalk.blue) => {
    process.off("SIGINT", handleSigint);

    output.write(
      color(
        chalk.inverse(
          `All scripts took ${DateTime.local()
            .diff(dateTimeAtSequenceLaunch)
            .toFormat("hh:mm:ss")}\n`,
        ),
      ),
    );
    outputLocalTime(color);
  };

  for (const item of items) {
    outputLocalTime();

    const dateTimeAtScriptLaunch = DateTime.local();

    output.write(chalk.inverse(`yarn exe ${item.scriptFilePath}\n\n`));

    // Using sub-process is slower, but more robust. It also allows to import scripts multiple times.
    const { exitCode } = await execa("yarn", ["exe", item.scriptFilePath], {
      stdio: "inherit",
      reject: false,
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      throw new AbortError();
    }

    const scriptDuration = DateTime.local()
      .diff(dateTimeAtScriptLaunch)
      .toFormat("hh:mm:ss");

    if (exitCode) {
      output.write(
        chalk.red(
          chalk.inverse(
            `\nScript failed with exit code ${exitCode} after ${scriptDuration}\n`,
          ),
        ),
      );
      if (!item.continueOnError) {
        finalizeSequence(chalk.red);
        throw new ExitCodeError(exitCode);
      }
    } else {
      output.write(
        chalk.blue(chalk.inverse(`\nScript took ${scriptDuration}\n`)),
      );
    }
  }

  finalizeSequence();
};
