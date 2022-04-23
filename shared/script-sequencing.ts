import chalk from "chalk";
import fs from "fs-extra";
import { DateTime } from "luxon";
import path from "node:path";
import { WriteStream } from "node:tty";

export interface ScriptSequenceItem {
  scriptFilePath: string;
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

  const outputLocalTime = () => {
    output.write(
      chalk.blue(
        chalk.inverse(`Local time ${DateTime.local().toFormat("HH:mm:ss")}\n`),
      ),
    );
  };

  output.write("\n");

  for (const item of items) {
    outputLocalTime();

    const dateTimeAtScriptLaunch = DateTime.local();

    output.write(chalk.inverse(`yarn exe ${item.scriptFilePath}\n\n`));
    await import(path.resolve(item.scriptFilePath));

    output.write(
      chalk.blue(
        chalk.inverse(
          `\nScript took ${DateTime.local()
            .diff(dateTimeAtScriptLaunch)
            .toFormat("hh:mm:ss")}\n`,
        ),
      ),
    );
  }

  output.write(
    chalk.blue(
      chalk.inverse(
        `All scripts took ${DateTime.local()
          .diff(dateTimeAtSequenceLaunch)
          .toFormat("hh:mm:ss")}\n`,
      ),
    ),
  );
  outputLocalTime();
};
