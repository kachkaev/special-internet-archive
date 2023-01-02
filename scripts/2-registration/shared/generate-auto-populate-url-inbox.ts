import chalk from "chalk";
import fs from "fs-extra";

import {
  getUrlInboxFilePath,
  parseUrlInboxRow,
  readUrlInboxRecords,
  UrlInboxRecord,
  UrlInboxUrlRecord,
  writeUrlInbox,
} from "../../../shared/collection";
import { serializeTime } from "../../../shared/time";
import { generateWebPageDirPathLookup } from "../../../shared/web-page-documents";

const output = process.stdout;

export const generateAutoPopulateUrlInbox = ({
  contentsLabel,
  listNewUrlInboxRows: listNewUrlInboxRows,
}: {
  contentsLabel: string;
  listNewUrlInboxRows: ({
    existingUrlInboxRows,
    output,
  }: {
    existingUrlInboxRows: UrlInboxRecord[];
    output: NodeJS.WriteStream;
  }) => Promise<string[]>;
}) => {
  return async () => {
    output.write(
      chalk.bold(`Auto-populating URL inbox with ${contentsLabel}\n`),
    );

    output.write(chalk.green("Indexing web page URLs in collection..."));
    const webPageDirPathLookup = await generateWebPageDirPathLookup();
    output.write(" Done\n");

    const existingUrlInboxRecords = (await readUrlInboxRecords()) ?? [];

    const existingUrlInboxUrlRecordLookup: Record<string, UrlInboxUrlRecord> =
      {};
    for (const record of existingUrlInboxRecords) {
      if (record.type === "url") {
        existingUrlInboxUrlRecordLookup[record.url] = record;
      }
    }

    const newUrlInboxRows = await listNewUrlInboxRows({
      existingUrlInboxRows: existingUrlInboxRecords,
      output,
    });

    if (newUrlInboxRows.length === 0) {
      output.write(chalk.gray(`There are no URLs to register.\n`));

      return;
    }

    const notYetRegisteredUrlRecordLookup: Record<string, UrlInboxUrlRecord> =
      {};
    for (const row of newUrlInboxRows) {
      const record = parseUrlInboxRow(row);
      if (record.type === "url" && !webPageDirPathLookup[record.url]) {
        notYetRegisteredUrlRecordLookup[record.url] = record;
      } else {
        output.write(chalk.yellow(`New record "${row}" is not a URL.\n`));
      }
    }

    const numberOfNotYetRegisteredUrls = Object.keys(
      notYetRegisteredUrlRecordLookup,
    ).length;

    if (numberOfNotYetRegisteredUrls === 0) {
      output.write(
        chalk.gray(
          newUrlInboxRows[0] && !newUrlInboxRows[1]
            ? `${newUrlInboxRows[0]} is already registered in the collection.\n`
            : `All ${numberOfNotYetRegisteredUrls} web page URLs are already registered in the collection.\n`,
        ),
      );

      return;
    }

    output.write(
      `Unique URLs that are not yet registered: ${numberOfNotYetRegisteredUrls}.\n`,
    );

    await fs.ensureFile(getUrlInboxFilePath());

    let rowsToWrite: string[] = existingUrlInboxRecords.map(
      (record) => record.text,
    );

    const rowsToAppend: string[] = [];
    for (const notYetRegisteredUrlRecord of Object.values(
      notYetRegisteredUrlRecordLookup,
    )) {
      const existingUrlInboxUrlRecord =
        existingUrlInboxUrlRecordLookup[notYetRegisteredUrlRecord.url];
      if (!existingUrlInboxUrlRecord) {
        rowsToAppend.push(notYetRegisteredUrlRecord.text);
      } else if (
        existingUrlInboxUrlRecord.comment !== notYetRegisteredUrlRecord.comment
      ) {
        output.write(
          chalk.yellow(
            `URL inbox already contains ${
              notYetRegisteredUrlRecord.url
            } with a different comment:  ${
              existingUrlInboxUrlRecord.comment ?? ""
            }\n  instead of  ${notYetRegisteredUrlRecord.comment ?? ""}\n`,
          ),
        );
      }
    }

    if (rowsToAppend.length === 0) {
      output.write(
        chalk.gray(
          `URL inbox already contains ${
            numberOfNotYetRegisteredUrls === 1
              ? "the URL that has"
              : `all ${numberOfNotYetRegisteredUrls} URLs that have`
          } not been registered yet.\n`,
        ),
      );
      output.write(
        `URL inbox location: ${chalk.gray(getUrlInboxFilePath())}\n`,
      );

      return;
    }

    const serializedTime = serializeTime();

    if (rowsToWrite.at(-1)?.trim() !== "") {
      rowsToWrite.push("");
    }

    rowsToAppend.sort();

    const wrapperMessage = `${rowsToAppend.length} URL${
      rowsToAppend.length === 1 ? "s" : ""
    } auto-populated with ${contentsLabel} at ${serializedTime}`;

    // Avoids ‘RangeError: Maximum call stack size exceeded’ when using `Array#push`
    rowsToWrite = [
      ...rowsToWrite,
      `## ↓ ${wrapperMessage} ##`,
      ...rowsToAppend,
      `## ↑ ${wrapperMessage} ##`,
    ];

    output.write(chalk.green("Updating URL inbox..."));
    await writeUrlInbox(rowsToWrite);

    output.write(` Done (URLs appended: ${chalk.blue(rowsToAppend.length)}`);
    if (rowsToAppend.length !== numberOfNotYetRegisteredUrls) {
      output.write(
        `, ${
          numberOfNotYetRegisteredUrls - rowsToAppend.length
        } already found in URL inbox`,
      );
    }
    output.write(`).\n`);

    for (const urlToAppend of rowsToAppend) {
      output.write(`${chalk.blue(chalk.underline(urlToAppend))}\n`);
    }

    output.write(
      `URL inbox location: ${chalk.magenta(getUrlInboxFilePath())}\n`,
    );
  };
};
