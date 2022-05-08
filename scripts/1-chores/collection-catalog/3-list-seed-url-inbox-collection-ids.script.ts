import chalk from "chalk";
import * as envalid from "envalid";
import { globby } from "globby";
import _ from "lodash";

import { cleanEnv } from "../../../shared/clean-env";
import { getCollectionCatalogSeedUrlInboxesDirPath } from "../../../shared/collection-catalog";

const output = process.stdout;

const script = async () => {
  const env = cleanEnv({
    OUTPUT_FORMAT: envalid.str({
      choices: ["raw", "json"],
      default: "raw",
    }),
  });
  const outputFormat = env.OUTPUT_FORMAT;

  if (outputFormat !== "json") {
    output.write(chalk.bold(`Listing seed URL inbox collection IDs\n`));
  }

  const fileNames = await globby("*.txt", {
    cwd: getCollectionCatalogSeedUrlInboxesDirPath(),
  });

  const collectionIds = _.orderBy(
    fileNames.map((fileName) => fileName.slice(0, -4)),
  );

  if (outputFormat === "json") {
    output.write(`${JSON.stringify(collectionIds)}\n`);
  } else {
    output.write(`Collections found: ${collectionIds.length}\n`);
    for (const collectionId of collectionIds) {
      output.write(`- ${chalk.blue(collectionId)}\n`);
    }
  }
};

await script();
