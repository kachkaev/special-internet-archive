import chalk from "chalk";
import _ from "lodash";

import {
  getUrlInboxFilePath,
  readUrlInboxRecords,
} from "../../shared/collection";
import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import { reportGithubMessageIfNeeded } from "../../shared/github";
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

  const urlInboxRecords = await readUrlInboxRecords();
  if (!urlInboxRecords) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const maxRowLength =
    _.max(urlInboxRecords.map((row) => row.text.length)) ?? 0;

  const invalidUrls: string[] = [];

  const webPageDirPathLookup = await generateWebPageDirPathLookup();

  for (const urlInboxRecord of urlInboxRecords) {
    output.write(
      `\n${chalk.blue(
        urlInboxRecord.text.padEnd(Math.min(maxRowLength, 80)),
      )} `,
    );

    if (urlInboxRecord.type !== "url") {
      if (urlInboxRecord.text.trim().length > 0) {
        output.write(`${chalk.yellow("not a URL")}`);
      }
      continue;
    }

    const operationResult = await registerWebPage(
      urlInboxRecord.url,
      "script:register-from-url-inbox",
      webPageDirPathLookup,
    );

    switch (operationResult.status) {
      case "failed": {
        output.write(chalk.yellow(operationResult.message ?? "unknown error"));
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
      invalidUrls.push(urlInboxRecord.url);
    }
  }

  output.write("\n");
  output.write("\n");

  if (invalidUrls.length > 0) {
    output.write(
      `${chalk.yellow(
        `Done with warnings. Number of invalid URLs: ${invalidUrls.length}.`,
      )} ${generateUrlExamplesMessage()}`,
    );
    reportGithubMessageIfNeeded({
      messageType: "warning",
      message: `URL inbox contains ${invalidUrls.length} invalid URL${
        invalidUrls.length > 1 ? "s" : ""
      }: ${invalidUrls.join(" ")}`,
      output,
    });
  } else {
    output.write("Done.\n");
  }

  await syncCollectionIfNeeded({
    output,
    message: "Register web pages from URL inbox",
  });
};

await script();
