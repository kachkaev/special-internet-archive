import chalk from "chalk";
import * as envalid from "envalid";
import path from "node:path";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../clean-env";
import { getWebPagesDirPath } from "../collection";
import { getErrorMessage } from "../errors";
import { listFilePaths } from "../list-file-paths";
import { WebPageDocument } from "../web-page-documents";
import { readWebPageDocument } from "./io";

export type ProcessWebPage = (payload: {
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
}) => void | Promise<void>;

export type HandleSkippedWebPage = ProcessWebPage;

export const processWebPages = async ({
  output,
  handleSkippedWebPage,
  processWebPage,
}: {
  output?: WriteStream | undefined;
  handleSkippedWebPage?: ProcessWebPage;
  processWebPage: ProcessWebPage;
}) => {
  const env = cleanEnv({
    FILTER_URL: envalid.str({
      desc: "Regex to use when filtering URLs",
      default: ".*",
    }),
  });
  const filterUrlRegex = RegexParser(env.FILTER_URL);

  let numberOfProcessed = 0;
  let numberOfErrors = 0;
  let numberOfSkipped = 0;

  const webPageDocumentPaths = await listFilePaths({
    filesNicknameToLog: "web page documents",
    fileSearchPattern: "**/web-page.json",
    fileSearchDirPath: getWebPagesDirPath(),
    output,
  });

  output?.write(chalk.green("Processing web pages..."));

  const webPageUrlLookup: Record<string, true> = {};

  for (const webPageDocumentPath of webPageDocumentPaths) {
    const webPageDirPath = path.dirname(webPageDocumentPath);

    const webPageDocument = await readWebPageDocument(webPageDirPath);

    output?.write(`\n${chalk.underline(webPageDocument.webPageUrl)} `);

    if (webPageUrlLookup[webPageDocument.webPageUrl]) {
      output?.write(chalk.red("skipping as duplicate web page document"));
      numberOfErrors += 1;
      continue;
    }

    // @todo Check nesting (which is not allowed):
    // path/to/web-page/web-page.json
    // path/to/web-page/oops/web-page.json

    webPageUrlLookup[webPageDocument.webPageUrl] = true;

    if (!filterUrlRegex.test(webPageDocument.webPageUrl)) {
      numberOfSkipped += 1;
      output?.write(chalk.gray(`does not match FILTER_URL`));
      await handleSkippedWebPage?.({
        webPageDirPath,
        webPageDocument,
      });

      continue;
    }

    try {
      await processWebPage({
        webPageDirPath,
        webPageDocument,
      });
      numberOfProcessed += 1;
    } catch (error) {
      numberOfErrors += 1;
      output?.write(chalk.red(`Unexpected error ${getErrorMessage(error)}`));
    }
  }

  output?.write(
    `\n\nWeb pages in collection: ${
      numberOfProcessed + numberOfErrors + numberOfSkipped
    } (processed: ${numberOfProcessed}, errors: ${numberOfErrors}, filtered out: ${numberOfSkipped}).\n`,
  );
};
