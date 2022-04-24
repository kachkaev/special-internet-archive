import chalk from "chalk";
import fs from "fs-extra";

import {
  getUrlInboxFilePath,
  readUrlInboxRows,
  writeUrlInbox,
} from "../../shared/collection";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";
import { extractRelevantWebPageUrls } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Auto-populating URL inbox\n"));

  const registeredWebPageUrlSet = new Set<string>();
  const relevantWebPageUrlSet = new Set<string>();

  await processWebPages({
    output,
    processWebPage: ({ webPageDirPath, webPageDocument }) => {
      registeredWebPageUrlSet.add(webPageDocument.webPageUrl);

      const relevantWebPageUrls = extractRelevantWebPageUrls({
        webPageDirPath,
        webPageDocument,
      });

      for (const relevantWebPageUrl of relevantWebPageUrls) {
        relevantWebPageUrlSet.add(relevantWebPageUrl);
      }

      output.write(
        `relevant web page URLs: ${
          relevantWebPageUrls.length > 0
            ? chalk.blue(relevantWebPageUrls.length)
            : "0"
        }`,
      );
    },
  });

  const notYetRegisteredUrls: string[] = [];
  for (const relevantWebPageUrl of relevantWebPageUrlSet) {
    if (!registeredWebPageUrlSet.has(relevantWebPageUrl)) {
      notYetRegisteredUrls.push(relevantWebPageUrl);
    }
  }

  if (notYetRegisteredUrls.length === 0) {
    output.write(
      chalk.gray(
        "All relevant web page URLs are registered in the collection.\n",
      ),
    );

    return;
  }

  notYetRegisteredUrls.sort();
  output.write(
    `Unique URLs that are not yet registered: ${notYetRegisteredUrls.length}.\n`,
  );

  await fs.ensureFile(getUrlInboxFilePath());

  const urlInboxLookup: Record<string, true> = {};
  const urlInboxRows = (await readUrlInboxRows()) ?? [];
  const linesToWrite: string[] = [];
  for (const urlInboxRow of urlInboxRows) {
    linesToWrite.push(urlInboxRow.text);
    if (urlInboxRow.type === "url") {
      urlInboxLookup[urlInboxRow.url] = true;
    }
  }

  const urlsToAppend: string[] = [];
  for (const notYetRegisteredUrl of notYetRegisteredUrls) {
    if (!urlInboxLookup[notYetRegisteredUrl]) {
      urlsToAppend.push(notYetRegisteredUrl);
    }
  }

  if (urlsToAppend.length === 0) {
    output.write(
      chalk.gray(
        `URL inbox already contains ${
          notYetRegisteredUrls.length === 1
            ? "the URL that has"
            : `all ${notYetRegisteredUrls.length} URLs that have`
        } not been registered yet.\n`,
      ),
    );
    output.write(`URL inbox location: ${chalk.gray(getUrlInboxFilePath())}\n`);

    return;
  }

  const serializedTime = serializeTime();

  if (linesToWrite.at(-1)?.trim() !== "") {
    linesToWrite.push("");
  }
  linesToWrite.push(
    `## ↓ appended by auto-populate-url-inbox script at ${serializedTime} ##`,
    ...urlsToAppend,
    `## ↑ appended by auto-populate-url-inbox script at ${serializedTime} ##`,
  );

  output.write(chalk.green("Updating URL inbox..."));
  await writeUrlInbox(linesToWrite);

  output.write(` Done (URLs appended: ${chalk.blue(urlsToAppend.length)}`);
  if (urlsToAppend.length !== notYetRegisteredUrls.length) {
    output.write(
      `, ${
        notYetRegisteredUrls.length - urlsToAppend.length
      } already found in URL inbox`,
    );
  }
  output.write(`).\n`);

  for (const urlToAppend of urlsToAppend) {
    output.write(`${chalk.blue(chalk.underline(urlToAppend))}\n`);
  }

  output.write(`URL inbox location: ${chalk.magenta(getUrlInboxFilePath())}\n`);
};

await script();
