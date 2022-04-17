import chalk from "chalk";
import _ from "lodash";

import { readUrlInboxRows } from "../../shared/collection";
import { registerWebPage } from "../../shared/web-page-documents";
import { generateUrlExamplesMessage } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Registering web pages from URL inbox\n"));

  const parsedRows = await readUrlInboxRows(output);
  if (!parsedRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const maxRowLength = _.max(parsedRows.map((row) => row.text.length)) ?? 0;

  let numberOfErrors = 0;

  for (const parsedRow of parsedRows) {
    output.write(`\n${chalk.blue(parsedRow.text.padEnd(maxRowLength + 1))}`);

    if (parsedRow.type !== "url") {
      if (parsedRow.text.trim().length > 0) {
        output.write(`${chalk.yellow("not a URL")}`);
      }
      continue;
    }

    const operationResult = await registerWebPage(
      parsedRow.url,
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
      `Done with warnings. ${chalk.red(
        `Number of invalid URLs: ${numberOfErrors}.`,
      )} ${generateUrlExamplesMessage()}`,
    );
  } else {
    output.write("Done.\n");
  }
};

await script();
