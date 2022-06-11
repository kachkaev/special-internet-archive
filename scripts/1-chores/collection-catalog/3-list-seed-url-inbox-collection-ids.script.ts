import chalk from "chalk";
import * as envalid from "envalid";
import { globby } from "globby";
import _ from "lodash";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../../shared/clean-env";
import { getCollectionCatalogSeedUrlInboxesDirPath } from "../../../shared/collection-catalog";

const output = process.stdout;

const script = async () => {
  const env = cleanEnv({
    FILTER_COLLECTION_ID: envalid.str({
      desc: "Regex to filter collections",
      default: "",
    }),
    OUTPUT_FORMAT: envalid.str({
      choices: ["raw", "json"],
      default: "raw",
    }),
  });
  const outputFormat = env.OUTPUT_FORMAT;
  const filterCollectionIdRegex = env.FILTER_COLLECTION_ID
    ? RegexParser(env.FILTER_COLLECTION_ID)
    : undefined;

  if (outputFormat !== "json") {
    output.write(chalk.bold(`Listing seed URL inbox collection IDs\n`));
  }

  const fileNames = await globby("*.txt", {
    cwd: getCollectionCatalogSeedUrlInboxesDirPath(),
  });

  const collectionIds = _.orderBy(
    fileNames.map((fileName) => fileName.slice(0, -4)),
  );
  const filteredCollectionIds = collectionIds.filter(
    (collectionId) =>
      !filterCollectionIdRegex || collectionId.match(filterCollectionIdRegex),
  );
  if (outputFormat === "json") {
    output.write(`${JSON.stringify(filteredCollectionIds)}\n`);
  } else {
    output.write(`Collections found: ${collectionIds.length}`);
    if (filteredCollectionIds.length !== collectionIds.length) {
      output.write(`, filtered: ${filteredCollectionIds.length}`);
    }
    output.write("\n");
    for (const collectionId of filteredCollectionIds) {
      output.write(`- ${chalk.blue(collectionId)}\n`);
    }
  }
};

await script();
