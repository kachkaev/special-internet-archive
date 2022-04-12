import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../clean-env";
import { getWebPagesDirPath } from "../collection";
import { getErrorMessage } from "../errors";
import { listFilePaths } from "../list-file-paths";
import { WebPageDocument } from "../web-page-documents";

export const processWebPages = async ({
  output,
  handleSkippedWebPage,
  processWebPage,
}: {
  output?: WriteStream | undefined;
  handleSkippedWebPage?: (
    webPageDocument: WebPageDocument,
  ) => void | Promise<void>;
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

  const webPageDocumentPaths = await listFilePaths({
    filesNicknameToLog: "web page documents",
    fileSearchPattern: "**/web-page.json",
    fileSearchDirPath: getWebPagesDirPath(),
    output,
  });

  output?.write(chalk.green("Processing web pages..."));

  for (const webPageDocumentPath of webPageDocumentPaths) {
    const webPageDocument = (await fs.readJson(
      webPageDocumentPath,
    )) as WebPageDocument;

    output?.write(`\n${chalk.underline(webPageDocument.webPageUrl)} `);

    if (!filterUrlRegex.test(webPageDocument.webPageUrl)) {
      numberOfSkipped += 1;
      output?.write(chalk.gray(`does not match FILTER_URL`));
      await handleSkippedWebPage?.(webPageDocument);

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
