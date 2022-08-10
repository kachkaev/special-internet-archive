import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";

import { cleanEnv } from "../../../shared/clean-env";
import { syncCollectionIfNeeded } from "../../../shared/collection-syncing";
import { UserFriendlyError } from "../../../shared/errors";
import { generateWebPageDirPathLookup } from "../../../shared/web-page-documents";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Deleting web page\n"));

  await syncCollectionIfNeeded({
    output,
    mode: "preliminary",
  });

  const env = cleanEnv({
    URL: envalid.url({ desc: "URL to delete" }),
  });

  const webPageUrl = env.URL;

  output.write(`URL to delete: ${chalk.underline(webPageUrl)}\n`);

  const webPageDirPathLookup = await generateWebPageDirPathLookup();
  const webPageDirPath = webPageDirPathLookup[webPageUrl];
  if (!webPageDirPath) {
    throw new UserFriendlyError(
      `Unable to find ${webPageUrl} in the collection`,
    );
  }

  output.write("Deleting web page directory... ");
  await fs.remove(webPageDirPath);
  output.write(chalk.magenta("done\n"));

  await syncCollectionIfNeeded({
    output,
    message: `Delete ${webPageUrl}`,
  });
};

await script();
