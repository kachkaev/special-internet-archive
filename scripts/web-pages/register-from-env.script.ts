import chalk from "chalk";
import * as envalid from "envalid";

import { cleanEnv } from "../../shared/clean-env";
import { EarlyExitError } from "../../shared/errors";
import {
  generateWebPagePath,
  registerWebPage,
} from "../../shared/web-page-documents";
import { generateUrlExamplesMessage } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Registering one web page from environment\n"));

  const { URL_TO_REGISTER: urlToRegister } = cleanEnv({
    URL_TO_REGISTER: envalid.url({
      desc: "Web page URL to register",
      example: "https://example.com/hello-world",
    }),
  });

  const operationResult = await registerWebPage(
    urlToRegister,
    "script:register-from-env",
  );

  if (operationResult.status === "failed") {
    output.write(`${chalk.red(operationResult.message)}\n\n`);
    output.write(generateUrlExamplesMessage());
    throw new EarlyExitError();
  } else if (operationResult.status === "processed") {
    output.write(
      `Web page ${chalk.underline(
        urlToRegister,
      )} was registered: ${chalk.magenta(
        generateWebPagePath(urlToRegister),
      )}\n`,
    );
  } else {
    output.write(
      `Web page ${chalk.underline(
        urlToRegister,
      )} is already registered: ${chalk.gray(
        generateWebPagePath(urlToRegister),
      )}\n`,
    );
  }
};

await script();
