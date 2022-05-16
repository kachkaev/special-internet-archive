import chalk from "chalk";
import _ from "lodash";

import { getUrlInboxFilePath, readUrlInboxRows } from "../../shared/collection";
import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import {
  generateWebPageDirPathLookup,
  registerWebPage,
} from "../../shared/web-page-documents";
import { generateUrlExamplesMessage } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Registering web pages from URL inbox\n"));

  await syncCollectionIfNeeded({
    output,
    mode: "preliminary",
  });

  output.write(
    `${chalk.green("URL inbox location:")} ${getUrlInboxFilePath()}\n`,
  );

  const urlInboxRows = await readUrlInboxRows();
  if (!urlInboxRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const maxRowLength = _.max(urlInboxRows.map((row) => row.text.length)) ?? 0;

  let numberOfErrors = 0;

  const webPageDirPathLookup = await generateWebPageDirPathLookup();

  for (const urlInboxRow of urlInboxRows) {
    output.write(`\n${chalk.blue(urlInboxRow.text.padEnd(maxRowLength + 1))}`);

    if (urlInboxRow.type !== "url") {
      if (urlInboxRow.text.trim().length > 0) {
        output.write(`${chalk.yellow("not a URL")}`);
      }
      continue;
    }

    const operationResult = await registerWebPage(
      urlInboxRow.url,
      "script:register-from-url-inbox",
      webPageDirPathLookup,
    );

    switch (operationResult.status) {
      case "failed": {
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

    if (operationResult.status === "failed") {
      numberOfErrors += 1;
    }
  }

  output.write("\n");
  output.write("\n");

  if (numberOfErrors) {
    output.write(
      `Done with warnings. ${chalk.red(
        `Number of invalid URLs: ${numberOfErrors}.`,
      )} ${generateUrlExamplesMessage()}`,
    );
  } else {
    output.write("Done.\n");
  }

  await syncCollectionIfNeeded({
    output,
    message: "Register web pages from URL inbox",
  });
};

await script();
