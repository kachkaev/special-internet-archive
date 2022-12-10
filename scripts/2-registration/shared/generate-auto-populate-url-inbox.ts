import chalk from "chalk";
import fs from "fs-extra";

import {
  getUrlInboxFilePath,
  readUrlInboxRows,
  writeUrlInbox,
} from "../../../shared/collection";
import { serializeTime } from "../../../shared/time";
import { generateWebPageDirPathLookup } from "../../../shared/web-page-documents";

const output = process.stdout;

export const generateAutoPopulateUrlInbox = ({
  contentsLabel,
  listWebPageUrls,
}: {
  contentsLabel: string;
  listWebPageUrls: ({
    output,
  }: {
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

    const webPageUrls = await listWebPageUrls({ output });

    if (webPageUrls.length === 0) {
      output.write(chalk.gray(`There are no URLs to register.\n`));

      return;
    }

    const notYetRegisteredUrlsSet = new Set<string>();
    for (const webPageUrl of webPageUrls) {
      if (!webPageDirPathLookup[webPageUrl]) {
        notYetRegisteredUrlsSet.add(webPageUrl);
      }
    }

    if (notYetRegisteredUrlsSet.size === 0) {
      output.write(
        chalk.gray(
          webPageUrls[0] && !webPageUrls[1]
            ? `${webPageUrls[0]} is already registered in the collection.\n`
            : `All ${webPageUrls.length} web page URLs are already registered in the collection.\n`,
        ),
      );

      return;
    }

    output.write(
      `Unique URLs that are not yet registered: ${notYetRegisteredUrlsSet.size}.\n`,
    );

    await fs.ensureFile(getUrlInboxFilePath());

    const urlInboxLookup: Record<string, true> = {};
    const urlInboxRows = (await readUrlInboxRows()) ?? [];
    let linesToWrite: string[] = [];
    for (const urlInboxRow of urlInboxRows) {
      linesToWrite.push(urlInboxRow.text);
      if (urlInboxRow.type === "url") {
        urlInboxLookup[urlInboxRow.url] = true;
      }
    }

    const urlsToAppend: string[] = [];
    for (const notYetRegisteredUrl of notYetRegisteredUrlsSet) {
      if (!urlInboxLookup[notYetRegisteredUrl]) {
        urlsToAppend.push(notYetRegisteredUrl);
      }
    }

    if (urlsToAppend.length === 0) {
      output.write(
        chalk.gray(
          `URL inbox already contains ${
            notYetRegisteredUrlsSet.size === 1
              ? "the URL that has"
              : `all ${notYetRegisteredUrlsSet.size} URLs that have`
          } not been registered yet.\n`,
        ),
      );
      output.write(
        `URL inbox location: ${chalk.gray(getUrlInboxFilePath())}\n`,
      );

      return;
    }

    const serializedTime = serializeTime();

    if (linesToWrite.at(-1)?.trim() !== "") {
      linesToWrite.push("");
    }

    urlsToAppend.sort();

    const wrapperMessage = `${urlsToAppend.length} URL${
      urlsToAppend.length === 1 ? "s" : ""
    } auto-populated with ${contentsLabel} at ${serializedTime}`;

    // Avoids ‘RangeError: Maximum call stack size exceeded’ when using `Array#push`
    linesToWrite = [
      ...linesToWrite,
      `## ↓ ${wrapperMessage} ##`,
      ...urlsToAppend,
      `## ↑ ${wrapperMessage} ##`,
    ];

    output.write(chalk.green("Updating URL inbox..."));
    await writeUrlInbox(linesToWrite);

    output.write(` Done (URLs appended: ${chalk.blue(urlsToAppend.length)}`);
    if (urlsToAppend.length !== notYetRegisteredUrlsSet.size) {
      output.write(
        `, ${
          notYetRegisteredUrlsSet.size - urlsToAppend.length
        } already found in URL inbox`,
      );
    }
    output.write(`).\n`);

    for (const urlToAppend of urlsToAppend) {
      output.write(`${chalk.blue(chalk.underline(urlToAppend))}\n`);
    }

    output.write(
      `URL inbox location: ${chalk.magenta(getUrlInboxFilePath())}\n`,
    );
  };
};
