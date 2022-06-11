import chalk from "chalk";
import * as envalid from "envalid";
import path from "node:path";
import { WriteStream } from "node:tty";
import RegexParser from "regex-parser";

import { cleanEnv } from "../clean-env";
import { getWebPagesDirPath } from "../collection";
import { AbortError, getErrorMessage } from "../errors";
import { generateProgress } from "../generate-progress";
import { listFilePaths } from "../list-file-paths";
import { OperationResult } from "../operations";
import { WebPageDocument } from "../web-page-documents";
import { checkContentMatch } from "../web-page-sources";
import { readWebPageDocument } from "./io";

export type ProcessWebPage = (payload: {
  progressPrefix: string;
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
}): Promise<OperationResult> => {
  const env = cleanEnv({
    FILTER_CONTENT: envalid.str({
      desc: "Regex to filter web page URLs",
      default: "",
    }),
    FILTER_URL: envalid.str({
      desc: "Regex to filter web page URLs",
      default: "",
    }),
  });

  const filterContentRegex = env.FILTER_CONTENT
    ? RegexParser(env.FILTER_CONTENT)
    : undefined;

  const filterUrlRegex = env.FILTER_URL
    ? RegexParser(env.FILTER_URL)
    : undefined;

  let numberOfProcessed = 0;
  let numberOfErrors = 0;
  let numberOfFilteredOut = 0;

  const webPageDocumentPaths = await listFilePaths({
    filesNicknameToLog: "web page documents",
    fileSearchPattern: "**/web-page.json",
    fileSearchDirPath: getWebPagesDirPath(),
    output,
  });

  output?.write(chalk.green("Processing web pages..."));

  const webPageUrlLookup: Record<string, true> = {};

  for (const [index, webPageDocumentPath] of webPageDocumentPaths.entries()) {
    const webPageDirPath = path.dirname(webPageDocumentPath);

    const webPageDocument = await readWebPageDocument(webPageDirPath);

    const { progress, progressPrefix } = generateProgress(
      index,
      webPageDocumentPaths.length,
    );

    output?.write(
      `\n${progress}${chalk.underline(webPageDocument.webPageUrl)} `,
    );

    if (webPageUrlLookup[webPageDocument.webPageUrl]) {
      output?.write(chalk.red("skipping as duplicate web page document"));
      numberOfErrors += 1;
      continue;
    }

    // @todo Check nesting (which is not allowed):
    // path/to/web-page/web-page.json
    // path/to/web-page/oops/web-page.json

    webPageUrlLookup[webPageDocument.webPageUrl] = true;

    let reasonToFilterOut: string | undefined;

    if (filterUrlRegex && !filterUrlRegex.test(webPageDocument.webPageUrl)) {
      reasonToFilterOut = `does not match FILTER_URL`;
    } else if (
      filterContentRegex &&
      !(await checkContentMatch({
        webPageDocument,
        webPageDirPath,
        contentRegex: filterContentRegex,
      }))
    ) {
      reasonToFilterOut = `does not match FILTER_CONTENT`;
    }

    if (reasonToFilterOut) {
      numberOfFilteredOut += 1;
      output?.write(chalk.gray(reasonToFilterOut));
      await handleSkippedWebPage?.({
        progressPrefix,
        webPageDirPath,
        webPageDocument,
      });

      continue;
    }

    try {
      await processWebPage({
        progressPrefix,
        webPageDirPath,
        webPageDocument,
      });
      numberOfProcessed += 1;
    } catch (error) {
      if (error instanceof AbortError) {
        throw error;
      }
      numberOfErrors += 1;
      output?.write(chalk.red(getErrorMessage(error)));
    }
  }

  output?.write(
    `\n\nWeb pages in collection: ${
      numberOfProcessed + numberOfErrors + numberOfFilteredOut
    } (processed: ${numberOfProcessed}, ${(numberOfErrors > 0
      ? chalk.red
      : chalk.reset)(
      `errors: ${numberOfErrors}`,
    )}, filtered out: ${numberOfFilteredOut})\n`,
  );

  if (numberOfErrors) {
    return { status: "failed" };
  } else if (numberOfProcessed) {
    return { status: "processed" };
  } else {
    return { status: "skipped" };
  }
};
