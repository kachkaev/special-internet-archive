import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import { getUrlInboxFilePath } from "../../shared/collection";
import { UserFriendlyError } from "../../shared/errors";
import { isUrl } from "../../shared/urls";
import {
  generateUrlExamplesMessage,
  listWebPageUrlExamples,
} from "../../shared/web-pages";
import { registerWebPage } from "../../shared/web-pages/register-web-page";

const output = process.stdout;

const readUrlInboxRows = async (): Promise<string[] | undefined> => {
  const filePath = getUrlInboxFilePath();
  try {
    const fileContents = await fs.readFile(filePath, "utf8");

    if (fileContents.trim().length === 0) {
      return undefined;
    }

    return fileContents.split(/\r?\n/g);
  } catch {
    throw new UserFriendlyError(
      "Unable tor read url inbox file. Try running `yarn exe scripts/web-pages/ensure-url-inbox.script.ts` first.",
    );
  }
};

const script = async () => {
  output.write(chalk.bold("Registering web pages from URL inbox\n"));
  output.write(`${getUrlInboxFilePath()}\n`);

  const urlInboxRows = await readUrlInboxRows();
  if (!urlInboxRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const maxRowLength = _.max(urlInboxRows.map((row) => row.length)) ?? 0;

  let numberOfErrors = 0;

  for (const row of urlInboxRows) {
    output.write(`\n${chalk.blue(row.padEnd(maxRowLength + 1))}`);

    const url = row.trim();
    if (!isUrl(url)) {
      if (url.length > 0) {
        output.write(`${chalk.yellow("not a URL")}`);
      }
      continue;
    }

    const operationResult = await registerWebPage(
      url,
      "script:register-from-url-inbox",
    );

    switch (operationResult.status) {
      case "failed": {
        numberOfErrors += 1;
        output.write(chalk.red(operationResult.message ?? "unknown error"));
        break;
      }
      case "processed": {
        output.write(chalk.magenta("registered"));
        break;
      }

      case "skipped": {
        output.write(chalk.gray("already registered"));
        break;
      }
    }
  }

  output.write("\n");

  if (numberOfErrors) {
    output.write(
      `${chalk.red(
        `Number of invalid URLs: ${numberOfErrors}.`,
      )} ${generateUrlExamplesMessage(listWebPageUrlExamples())}`,
    );
  }

  output.write("Done.\n");
};

await script();
