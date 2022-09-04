import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { globby } from "globby";
import _ from "lodash";
import path from "node:path";
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
  filter: string;
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

  const filterContentRegex = RegexParser(env.VK_POST_SELECTION_FILTER_CONTENT);
  const outputFilePath = path.resolve(env.VK_POST_SELECTION_OUTPUT_FILE_PATH);

  output.write(
    chalk.green("Looking for snapshot summary combination files..."),
  );
  const filePaths = await globby(
    "**/vk/accounts/*/snapshot-summary-combination.json",
    { absolute: true, cwd: env.VK_POST_SELECTION_INPUT_DIR_PATH },
  );

  const numberOfScannedAccounts = filePaths.length;
  output.write(` Accounts scanned: ${chalk.blue(numberOfScannedAccounts)}\n`);

  let numberOfScannedPosts = 0;
  const selectedPosts: TempRawVkPost[] = [];

  output.write(chalk.green(`Reading snapshot summary combination files...`));
  for (const filePath of filePaths) {
    const snapshotSummaryCombinationDocument = (await fs.readJson(
      filePath,
    )) as unknown as SnapshotSummaryCombinationDocument;

    for (const post of snapshotSummaryCombinationDocument.tempRawVkPosts ??
      []) {
      numberOfScannedPosts += 1;
      if (filterContentRegex.test(post.text)) {
        selectedPosts.push(post);
      }
    }
  }

  const vkPostSelection: VkPostSelection = {
    generatedAt: serializeTime(),
    filter: env.VK_POST_SELECTION_FILTER_CONTENT,
    numberOfScannedAccounts,
    numberOfScannedPosts,
    numberOfSelectedPosts: selectedPosts.length,
    selectedPosts: _.orderBy(selectedPosts, [
      (post) => {
        const urlPayload = categorizeVkUrl(post.url);
        if (urlPayload.vkPageType !== "post") {
          throw new Error(`Unexpected vkPageType ${urlPayload.vkPageType}`);
        }

        return `${
          urlPayload.accountId.padStart(10, "0") //
        }${
          urlPayload.postId.padStart(10, "0") //
        }`;
      },
    ]),
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
