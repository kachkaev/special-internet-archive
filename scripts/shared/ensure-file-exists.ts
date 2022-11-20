import path from "node:path";
import { WriteStream } from "node:tty";

import chalk from "chalk";
import fs from "fs-extra";

export const ensureFileExists = async (
  rawFilePath: string,
  output?: WriteStream | undefined,
) => {
  const filePath = path.resolve(rawFilePath);
  if (await fs.pathExists(filePath)) {
    output?.write(`File already exists: ${chalk.gray(`${filePath}`)}\n`);

    return;
  }

  output?.write(`Creating file...`);
  await fs.ensureFile(filePath);
  output?.write(` Done: ${chalk.magenta(`${filePath}`)}\n`);
};
