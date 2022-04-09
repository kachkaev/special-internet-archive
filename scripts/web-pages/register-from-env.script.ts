import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";

import { cleanEnv } from "../../shared/clean-env";
import { serializeTime } from "../../shared/helpers-for-json";
import {
  generateWebPageFilePath,
  writeWebPageDocument,
} from "../../shared/web-pages";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Registering a web page from environment\n"));

  const { URL_TO_REGISTER: urlsToRegister } = cleanEnv({
    URL_TO_REGISTER: envalid.str({
      desc: "Web page URL to register",
      example: "https://example.com/hello-world",
    }),
  });

  const webPageDocumentFilePath = generateWebPageFilePath(urlsToRegister);

  if (await fs.pathExists(webPageDocumentFilePath)) {
    output.write(
      chalk.gray(
        `Web page ${chalk.underline(
          urlsToRegister,
        )} is already registered: ${webPageDocumentFilePath}\n`,
      ),
    );

    return;
  }

  await writeWebPageDocument({
    documentType: "webPage",
    url: urlsToRegister,
    registeredAt: serializeTime(),
    registeredVia: "script:register-by-url",
    annotation: {},
    capturing: {},
    waybackMachine: {},
  });

  output.write(
    `Web page ${chalk.underline(
      urlsToRegister,
    )} was registered: ${chalk.magenta(webPageDocumentFilePath)}\n`,
  );
};

await script();
