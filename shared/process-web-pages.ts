import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "./clean-env";
import { getWebPagesDirPath } from "./collection";
import { getErrorMessage } from "./errors";
import { listFilePaths } from "./list-file-paths";
import { WebPageDocument } from "./web-pages/types";

export const processWebPages = async ({
  output,
  processWebPage,
}: {
  output?: WriteStream | undefined;
  processWebPage: (webPageDocument: WebPageDocument) => void | Promise<void>;
}) => {
  const env = cleanEnv({
    FILTER_URL: envalid.str({
      desc: "Regex to use when filtering URLs",
      default: ".*",
    }),
  });
  const filterUrlRegex = RegexParser(env.FILTER_URL);

  let numberOfDone = 0;
  let numberOfErrors = 0;
  let numberOfSkipped = 0;

  const webPageDocumentFilePaths = await listFilePaths({
    filesNicknameToLog: "web pages",
    fileSearchPattern: "**/web-page.json",
    fileSearchDirPath: getWebPagesDirPath(),
    output,
  });

  output?.write(chalk.green("Processing web pages..."));

  for (const webPageDocumentFilePath of webPageDocumentFilePaths) {
    const webPageDocument = (await fs.readJson(
      webPageDocumentFilePath,
    )) as WebPageDocument;

    output?.write(`\n${chalk.underline(webPageDocument.url)} `);

    if (!filterUrlRegex.test(webPageDocument.url)) {
      numberOfSkipped += 1;
      output?.write(chalk.gray(` does not match FILTER_URL`));

      continue;
    }

    try {
      await processWebPage(webPageDocument);
      numberOfDone += 1;
    } catch (error) {
      numberOfErrors += 1;
      output?.write(chalk.red(`Unexpected error ${getErrorMessage(error)}`));
    }
  }

  output?.write(
    `\n\nWeb pages in collection: ${
      numberOfDone + numberOfErrors + numberOfSkipped
    } (processed: ${numberOfDone}, errors: ${numberOfErrors}, filtered out: ${numberOfSkipped}).\n`,
  );
};
