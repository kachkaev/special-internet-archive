import chalk from "chalk";
import path from "node:path";
import { WriteStream } from "node:tty";

import { getWebPagesDirPath } from "../collection";
import { AbortError, getErrorMessage } from "../errors";
import { generateProgress } from "../generate-progress";
import { listFilePaths } from "../list-file-paths";
import { OperationResult } from "../operations";
import { readWebPageDocument } from "./io";
import { ProcessWebPage } from "./types";

interface IncompleteBacklogItem {
  progress: string;
  webPageUrl: string;
}

interface BacklogItem extends IncompleteBacklogItem {
  operationResult: OperationResult;
}

// @todo Implement
// const outputFlushTimeout = 3000;

export const processWebPages = async ({
  output,
  processWebPage,
}: {
  output?: WriteStream | undefined;
  processWebPage: ProcessWebPage;
}): Promise<OperationResult> => {
  let numberOfFailed = 0;
  let numberOfProcessed = 0;
  let numberOfSkipped = 0;

  const webPageDocumentPaths = await listFilePaths({
    filesNicknameToLog: "web page documents",
    fileSearchPattern: "**/web-page.json",
    fileSearchDirPath: getWebPagesDirPath(),
    output,
  });

  output?.write(chalk.green("Processing web pages..."));

  const webPageUrlLookup: Record<string, true> = {};

  let backlogItems: BacklogItem[] = [];
  let incompleteBacklogItem: IncompleteBacklogItem | undefined;

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalOutputWrite = output?.write;
  const originalBoundOutputWrite = originalOutputWrite?.bind(output);

  const outputIncompleteBacklogItem = (backlogItem: IncompleteBacklogItem) => {
    originalBoundOutputWrite?.(
      `\n${backlogItem.progress}${chalk.underline(backlogItem.webPageUrl)} `,
    );
  };

  const outputOperationResult = (operationResult: OperationResult) => {
    let color;
    if (operationResult.status === "failed") {
      color = chalk.red;
    } else if (operationResult.status === "processed") {
      color = chalk;
    } else {
      color = chalk.gray;
    }
    originalBoundOutputWrite?.(color(operationResult.message));
  };

  const flushOutputBacklog = () => {
    for (const [index, backlogItem] of backlogItems.entries()) {
      if (
        index > 0 &&
        index < backlogItems.length - 1 &&
        backlogItems.length > 3
      ) {
        if (index === 1) {
          originalBoundOutputWrite?.(
            `\n${" ".repeat(backlogItem.progress.length)}...`,
          );
        }
      } else {
        outputIncompleteBacklogItem(backlogItem);
        outputOperationResult(backlogItem.operationResult);
      }
    }

    if (incompleteBacklogItem) {
      outputIncompleteBacklogItem(incompleteBacklogItem);
    }

    backlogItems = [];
    incompleteBacklogItem = undefined;
  };

  if (output && originalOutputWrite) {
    // eslint-disable-next-line no-param-reassign
    output.write = (text) => {
      flushOutputBacklog();

      return originalOutputWrite.call(output, text);
    };
  }

  for (const [index, webPageDocumentPath] of webPageDocumentPaths.entries()) {
    const webPageDirPath = path.dirname(webPageDocumentPath);

    const webPageDocument = await readWebPageDocument(webPageDirPath);

    // @todo Check nesting (which is not allowed):
    // path/to/web-page/web-page.json
    // path/to/web-page/oops/web-page.json

    const { progress, progressPrefix } = generateProgress(
      index,
      webPageDocumentPaths.length,
    );

    incompleteBacklogItem = {
      progress,
      webPageUrl: webPageDocument.webPageUrl,
    };

    let operationResult: OperationResult;

    if (webPageUrlLookup[webPageDocument.webPageUrl]) {
      operationResult = {
        status: "failed",
        message: "skipping as duplicate web page document",
      };
    } else {
      webPageUrlLookup[webPageDocument.webPageUrl] = true;
      try {
        operationResult = await processWebPage({
          progressPrefix,
          webPageDirPath,
          webPageDocument,
        });
      } catch (error) {
        if (error instanceof AbortError) {
          throw error;
        }
        operationResult = {
          status: "failed",
          message: `unhandled error: ${getErrorMessage(error)}`,
        };
      }
    }

    if (operationResult.status === "failed") {
      numberOfFailed += 1;
    } else if (operationResult.status === "processed") {
      numberOfProcessed += 1;
    } else {
      numberOfSkipped += 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (incompleteBacklogItem) {
      const backlogItem = { ...incompleteBacklogItem, operationResult };
      const previousOperationResult = backlogItems.at(-1)?.operationResult;
      backlogItems.push(backlogItem);
      incompleteBacklogItem = undefined;

      if (operationResult.status !== "skipped") {
        flushOutputBacklog();
      } else if (
        previousOperationResult &&
        (previousOperationResult.status !== "skipped" ||
          previousOperationResult.message !== operationResult.message)
      ) {
        flushOutputBacklog();
      }
    } else {
      outputOperationResult(operationResult);
    }
  }

  flushOutputBacklog();

  if (output && originalOutputWrite) {
    // eslint-disable-next-line no-param-reassign
    output.write = originalOutputWrite;
  }

  output?.write(
    `\n\nWeb pages in collection: ${
      numberOfProcessed + numberOfFailed + numberOfSkipped
    } (processed: ${numberOfProcessed}, ${(numberOfFailed > 0
      ? chalk.red
      : chalk.reset)(
      `failed: ${numberOfFailed}`,
    )}, skipped: ${numberOfSkipped})\n`,
  );

  if (numberOfFailed) {
    return { status: "failed" };
  } else if (numberOfProcessed) {
    return { status: "processed" };
  } else {
    return { status: "skipped" };
  }
};
