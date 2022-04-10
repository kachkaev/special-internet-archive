import chalk from "chalk";
import fs from "fs-extra";

import {
  getUrlInboxFilePath,
  ParsedUrlInboxRow,
  readUrlInboxRows,
} from "../../shared/collection";
import { checkIfWebPageDocumentExists } from "../../shared/web-pages";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Cleaning up URL inbox\n"));

  const parsedRows = await readUrlInboxRows(output);
  if (!parsedRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const parsedRowsToKeep: ParsedUrlInboxRow[] = [];
  const parsedRowsToRemove: ParsedUrlInboxRow[] = [];

  for (const parsedRow of parsedRows) {
    if (
      parsedRow.type === "url" &&
      (await checkIfWebPageDocumentExists(parsedRow.url))
    ) {
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

  const newFileContents = parsedRowsToKeep
    .map((parsedRow) => parsedRow.text)
    .join("\n");
  await fs.writeFile(getUrlInboxFilePath(), newFileContents);

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
