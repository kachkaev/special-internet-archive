import chalk from "chalk";

import {
  getUrlInboxFilePath,
  readUrlInboxRows,
  UrlInboxRow,
  writeUrlInbox,
} from "../../shared/collection";
import { generateWebPageDirPathLookup } from "../../shared/web-page-documents";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Cleaning up URL inbox\n"));

  output.write(
    `${chalk.green("URL inbox location:")} ${getUrlInboxFilePath()}\n`,
  );

  const urlInboxRows = await readUrlInboxRows();
  if (!urlInboxRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const urlInboxRowsToKeep: UrlInboxRow[] = [];
  const urlInboxRowsToRemove: UrlInboxRow[] = [];

  const webPageDirPathLookup = await generateWebPageDirPathLookup();

  for (const urlInboxRow of urlInboxRows) {
    if (urlInboxRow.type === "url" && webPageDirPathLookup[urlInboxRow.url]) {
      urlInboxRowsToRemove.push(urlInboxRow);
    } else {
      urlInboxRowsToKeep.push(urlInboxRow);
    }
  }

  for (let rowIndex = 0; rowIndex < urlInboxRowsToKeep.length; rowIndex += 1) {
    if (
      !urlInboxRowsToKeep[rowIndex]?.text.startsWith(
        "## ↓ appended by auto-populate-url-inbox script",
      ) ||
      !urlInboxRowsToKeep[rowIndex + 1]?.text.startsWith(
        "## ↑ appended by auto-populate-url-inbox script",
      )
    ) {
      continue;
    }

    urlInboxRowsToRemove.push(...urlInboxRowsToKeep.splice(rowIndex, 2));

    if (urlInboxRowsToKeep[rowIndex - 1]?.text.trim() === "") {
      urlInboxRowsToRemove.push(...urlInboxRowsToKeep.splice(rowIndex - 1, 1));
      rowIndex -= 1;
    }
  }

  if (urlInboxRowsToKeep.length === urlInboxRows.length) {
    output.write(chalk.gray("There are no rows to remove from url-inbox\n"));

    return;
  }

  const linesToWrite = urlInboxRowsToKeep.map(
    (urlInboxRow) => urlInboxRow.text,
  );

  await writeUrlInbox(linesToWrite);

  for (const urlInboxRow of urlInboxRows) {
    if (urlInboxRowsToRemove.includes(urlInboxRow)) {
      output.write(`\n${chalk.magenta(chalk.strikethrough(urlInboxRow.text))}`);
    } else {
      output.write(`\n${chalk.blue(urlInboxRow.text)}`);
    }
  }

  const removedUrlCount = urlInboxRowsToRemove.filter(
    (urlInboxRow) => urlInboxRow.type === "url",
  ).length;

  const totalUrlCount = urlInboxRows.filter(
    (urlInboxRow) => urlInboxRow.type === "url",
  ).length;

  output.write(
    `\nDone. URLs removed: ${removedUrlCount} of ${totalUrlCount}.\n`,
  );
};

await script();
