import path from "node:path";

import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";

import { cleanEnv } from "../../shared/clean-env";
import { getCollectionDirPath } from "../../shared/collection";
import { formatJson } from "../../shared/json-formatting";
import { processFiles } from "../../shared/process-files";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Formatting data files in collection\n"));

  const { CUSTOM_PATH: customPath } = cleanEnv({
    CUSTOM_PATH: envalid.str({ default: "" }),
  });

  await processFiles({
    fileSearchPattern: ["**/*.json", "!**/snapshots/*/**/*"],
    fileSearchDirPath: customPath
      ? path.resolve(getCollectionDirPath(), customPath)
      : getCollectionDirPath(),
    filesNicknameToLog: "files to format",
    output,
    statusReportFrequency: 0,
    processFile: async (filePath) => {
      const originalJson = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(originalJson) as unknown;
      const formattedJson = formatJson(jsonData);
      if (originalJson !== formattedJson) {
        await fs.writeFile(filePath, formattedJson, "utf8");
      }
    },
  });
};

await script();
