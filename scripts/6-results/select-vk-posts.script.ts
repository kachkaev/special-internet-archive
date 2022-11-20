import path from "node:path";

import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { globby } from "globby";
import _ from "lodash";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../shared/clean-env";
import { writeFormattedJson } from "../../shared/json-formatting";
import {
  SnapshotSummaryCombinationDocument,
  TempRawVkPost,
} from "../../shared/snapshot-summaries";
import { serializeTime } from "../../shared/time";
import { categorizeVkUrl } from "../../shared/web-page-sources/=vk/categorize-vk-url";

const output = process.stdout;

interface VkPostSelection {
  generatedAt: string;
  filterContent: string;
  numberOfScannedAccounts: number;
  numberOfScannedPosts: number;
  numberOfSelectedPosts: number;
  selectedPosts: TempRawVkPost[];
}

const script = async () => {
  output.write(chalk.bold(`Selecting VK posts\n`));

  const env = cleanEnv({
    VK_POST_SELECTION_FILTER_CONTENT: envalid.str({
      desc: "Regex to filter web page URLs",
    }),
    VK_POST_SELECTION_INPUT_DIR_PATH: envalid.str(),
    VK_POST_SELECTION_OUTPUT_FILE_PATH: envalid.str(),
  });

  const filterContent = env.VK_POST_SELECTION_FILTER_CONTENT;
  const filterContentRegex = RegexParser(filterContent);
  const outputFilePath = path.resolve(env.VK_POST_SELECTION_OUTPUT_FILE_PATH);

  output.write(chalk.green(`Filter: ${chalk.blue(filterContent)}\n`));
  output.write(
    chalk.green("Looking for snapshot summary combination files..."),
  );
  const filePaths = await globby(
    "**/vk/accounts/*/snapshot-summary-combination.json",
    {
      absolute: true,
      cwd: env.VK_POST_SELECTION_INPUT_DIR_PATH,
      ignore: ["**/posts/**"],
    },
  );

  const numberOfScannedAccounts = filePaths.length;
  output.write(` Accounts scanned: ${chalk.blue(numberOfScannedAccounts)}\n`);

  let numberOfScannedPosts = 0;
  const rawSelectedPosts: TempRawVkPost[] = [];

  output.write(chalk.green(`Reading snapshot summary combination files...`));
  for (const filePath of filePaths) {
    const snapshotSummaryCombinationDocument = (await fs.readJson(
      filePath,
    )) as unknown as SnapshotSummaryCombinationDocument;

    for (const post of snapshotSummaryCombinationDocument.tempRawVkPosts ??
      []) {
      numberOfScannedPosts += 1;
      if (filterContentRegex.test(post.text)) {
        rawSelectedPosts.push(post);
      }
    }
  }
  const selectedPosts = _.uniqBy(
    _.orderBy(rawSelectedPosts, [
      (post) => {
        const urlPayload = categorizeVkUrl(post.url);
        if (urlPayload.vkPageType !== "post") {
          throw new Error(`Unexpected vkPageType ${urlPayload.vkPageType}`);
        }

        return `${urlPayload.accountId < 0 ? "1" : "2"}${
          Math.abs(urlPayload.accountId) + 1_000_000_000 + urlPayload.itemId
        }`;
      },
    ]),
    (post) => post.url,
  );

  const vkPostSelection: VkPostSelection = {
    generatedAt: serializeTime(),
    filterContent,
    numberOfScannedAccounts,
    numberOfScannedPosts,
    numberOfSelectedPosts: selectedPosts.length,
    selectedPosts,
  };

  output.write(
    ` Posts scanned: ${chalk.blue(
      numberOfScannedPosts,
    )}, selected: ${chalk.blue(selectedPosts.length)}\n`,
  );

  output.write(chalk.green("Saving result..."));
  await writeFormattedJson(outputFilePath, vkPostSelection);
  output.write(` Done: ${chalk.magenta(outputFilePath)}\n`);
};

await script();
