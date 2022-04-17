import chalk from "chalk";
import * as envalid from "envalid";

import { cleanEnv } from "../../shared/clean-env";
import {
  processWebPages,
  registerWebPage,
} from "../../shared/web-page-documents";
import { extractRelevantWebPageUrls } from "../../shared/web-page-sources";
import { outputRegisterWebPageOperationResult } from "../shared/output-register-web-page-operation-result";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Registering web pages from annotations\n"));

  const env = cleanEnv({
    DRY_RUN: envalid.bool({
      desc: "If set to true, page URLs will listed but not actually registered",
      default: false,
    }),
  });

  const dryRun = env.DRY_RUN;

  if (dryRun) {
    output.write(chalk.blue(`DRY_RUN mode enabled\n`));
  }

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

  const urlsToRegister: string[] = [];
  for (const relevantWebPageUrl of relevantWebPageUrlSet) {
    if (!registeredWebPageUrlSet.has(relevantWebPageUrl)) {
      urlsToRegister.push(relevantWebPageUrl);
    }
  }

  if (urlsToRegister.length === 0) {
    output.write(chalk.yellow("There are no new web page URLs to register.\n"));

    return;
  }

  urlsToRegister.sort();
  let numberOfErrors = 0;
  let numberOfSkipped = 0;
  let numberOfProcessed = 0;

  if (dryRun) {
    output.write(
      chalk.blue(
        `DRY_RUN mode: ${urlsToRegister.length} web page${
          urlsToRegister.length !== 1 ? "s" : ""
        } found.`,
      ),
    );
  } else {
    output.write(
      chalk.green(
        `Registering ${urlsToRegister.length} web page${
          urlsToRegister.length !== 1 ? "s" : ""
        }...`,
      ),
    );
  }

  for (const urlToRegister of urlsToRegister) {
    output.write(`\n ${chalk.underline(urlToRegister)} `);

    if (dryRun) {
      continue;
    }

    const operationResult = await registerWebPage(
      urlToRegister,
      "script:register-from-annotation",
    );

    outputRegisterWebPageOperationResult({ output, operationResult });

    switch (operationResult.status) {
      case "failed":
        numberOfErrors += 1;
        break;
      case "skipped":
        numberOfSkipped += 1;
        break;
      case "processed":
        numberOfProcessed += 1;
        break;
    }
  }

  if (dryRun) {
    output.write(`\nDone (processed: ${numberOfProcessed}`);
    if (numberOfSkipped) {
      output.write(`, skipped: ${chalk.gray(numberOfSkipped)}`);
    }
    if (numberOfErrors) {
      output.write(`, errors: ${chalk.red(numberOfErrors)}`);
    }
    output.write(`).\n`);
  } else {
    output.write(
      chalk.blue(`DRY_RUN mode: Set DRY_RUN=false to register pages for real.`),
    );
  }
};

await script();
