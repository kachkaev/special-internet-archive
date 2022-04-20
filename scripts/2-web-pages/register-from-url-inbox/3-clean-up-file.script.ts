import chalk from "chalk";

import {
  getUrlInboxFilePath,
  ParsedUrlInboxRow,
  readUrlInboxRows,
  writeUrlInbox,
} from "../../../shared/collection";
import { processWebPages } from "../../../shared/web-page-documents";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Cleaning up URL inbox file\n"));

  output.write(
    `${chalk.green("URL inbox file location:")} ${getUrlInboxFilePath()}\n`,
  );

  const parsedRows = await readUrlInboxRows();
  if (!parsedRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const parsedRowsToKeep: ParsedUrlInboxRow[] = [];
  const parsedRowsToRemove: ParsedUrlInboxRow[] = [];

  const webPageUrlLookup: Record<string, true> = {};
  await processWebPages({
    processWebPage: ({ webPageDocument }) => {
      webPageUrlLookup[webPageDocument.webPageUrl] = true;
    },
  });

  for (const parsedRow of parsedRows) {
    if (parsedRow.type === "url" && webPageUrlLookup[parsedRow.url]) {
      parsedRowsToRemove.push(parsedRow);
    } else {
      parsedRowsToKeep.push(parsedRow);
    }
  }

  if (parsedRowsToRemove.length === 0) {
    output.write(
      chalk.gray(
        "URL inbox does not contain any registered web pages, so there are no rows to remove.\n",
      ),
    );

    return;
  }

  await writeUrlInbox(parsedRowsToKeep.map((parsedRow) => parsedRow.text));

  for (const parsedRow of parsedRows) {
    if (parsedRowsToRemove.includes(parsedRow)) {
      output.write(`\n${chalk.magenta(chalk.strikethrough(parsedRow.text))}`);
    } else {
      output.write(`\n${chalk.blue(parsedRow.text)}`);
    }
  }

  const totalUrlCount = parsedRows.filter(
    (parsedRow) => parsedRow.type === "url",
  ).length;

  output.write(
    `\nDone. URLs removed: ${parsedRowsToRemove.length} of ${totalUrlCount}.\n`,
  );
};

await script();
