import chalk from "chalk";

import {
  getUrlInboxFilePath,
  readUrlInboxRecords,
  UrlInboxRecord,
  writeUrlInbox,
} from "../../shared/collection";
import { generateWebPageDirPathLookup } from "../../shared/web-page-documents";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Cleaning up URL inbox\n"));

  output.write(
    `${chalk.green("URL inbox location:")} ${getUrlInboxFilePath()}\n`,
  );

  const urlInboxRecords = await readUrlInboxRecords();
  if (!urlInboxRecords) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const urlInboxRecordsToKeep: UrlInboxRecord[] = [];
  const urlInboxRecordsToRemove: UrlInboxRecord[] = [];

  const webPageDirPathLookup = await generateWebPageDirPathLookup();

  for (const urlInboxRecord of urlInboxRecords) {
    if (
      urlInboxRecord.type === "url" &&
      webPageDirPathLookup[urlInboxRecord.url]
    ) {
      urlInboxRecordsToRemove.push(urlInboxRecord);
    } else {
      urlInboxRecordsToKeep.push(urlInboxRecord);
    }
  }

  for (
    let rowIndex = 0;
    rowIndex < urlInboxRecordsToKeep.length;
    rowIndex += 1
  ) {
    if (
      !urlInboxRecordsToKeep[rowIndex]?.text.match(
        /## (↓|↑) (appended by|\d+ URLs? auto-populated with)/, // "appended by" was used before 2022-12-10
      )
    ) {
      continue;
    }

    urlInboxRecordsToRemove.push(...urlInboxRecordsToKeep.splice(rowIndex, 2));

    if (urlInboxRecordsToKeep[rowIndex - 1]?.text.trim() === "") {
      urlInboxRecordsToRemove.push(
        ...urlInboxRecordsToKeep.splice(rowIndex - 1, 1),
      );
      rowIndex -= 1;
    }
  }

  if (urlInboxRecordsToKeep.length === urlInboxRecords.length) {
    output.write(chalk.gray("There are no rows to remove from url-inbox\n"));

    return;
  }

  const linesToWrite = urlInboxRecordsToKeep.map(
    (urlInboxRecord) => urlInboxRecord.text,
  );

  await writeUrlInbox(linesToWrite);

  for (const urlInboxRecord of urlInboxRecords) {
    if (urlInboxRecordsToRemove.includes(urlInboxRecord)) {
      output.write(
        `\n${chalk.magenta(chalk.strikethrough(urlInboxRecord.text))}`,
      );
    } else {
      output.write(`\n${chalk.blue(urlInboxRecord.text)}`);
    }
  }

  const removedUrlCount = urlInboxRecordsToRemove.filter(
    (urlInboxRecord) => urlInboxRecord.type === "url",
  ).length;

  const totalUrlCount = urlInboxRecords.filter(
    (urlInboxRecord) => urlInboxRecord.type === "url",
  ).length;

  output.write(
    `\nDone. URLs removed: ${removedUrlCount} of ${totalUrlCount}.\n`,
  );
};

await script();
