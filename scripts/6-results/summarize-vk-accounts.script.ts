import path from "node:path";

import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { globby } from "globby";

import { cleanEnv } from "../../shared/clean-env";
import { deepClean } from "../../shared/deep-clean";
import { writeFormattedJson } from "../../shared/json-formatting";
import { SnapshotSummaryCombinationDocument } from "../../shared/snapshot-summaries";
import { serializeTime } from "../../shared/time";

const output = process.stdout;

interface VkAccountSummary {
  url: string;
  id?: number;
  description?: string;
  notFound?: true;
  title?: string;
  titleInfo?: string;
  verified?: true;
  numberOfPosts?: number;
}

interface VkAccountSelection {
  generatedAt: string;
  numberOfScannedAccounts: number;
  accountSummaries: VkAccountSummary[];
}

const script = async () => {
  output.write(chalk.bold(`Summarizing VK accounts\n`));

  const env = cleanEnv({
    VK_ACCOUNT_SUMMARY_INPUT_DIR_PATH: envalid.str(),
    VK_ACCOUNT_SUMMARY_OUTPUT_FILE_PATH: envalid.str(),
  });

  const outputFilePath = path.resolve(env.VK_ACCOUNT_SUMMARY_OUTPUT_FILE_PATH);

  output.write(
    chalk.green("Looking for snapshot summary combination files..."),
  );
  const filePaths = await globby(
    "**/vk/accounts/*/snapshot-summary-combination.json",
    {
      absolute: true,
      cwd: env.VK_ACCOUNT_SUMMARY_INPUT_DIR_PATH,
      ignore: ["**/posts/**"],
    },
  );

  const numberOfScannedVkAccounts = filePaths.length;

  const vkAccountSummaries: VkAccountSummary[] = [];

  output.write(chalk.green(`Reading snapshot summary combination files...`));
  for (const filePath of filePaths) {
    const snapshotSummaryCombinationDocument = (await fs.readJson(
      filePath,
    )) as unknown as SnapshotSummaryCombinationDocument;

    const id = snapshotSummaryCombinationDocument.tempRawVkPosts
      ?.at(-1)
      ?.url.match(/wall(-?\d+)/)?.[1];

    vkAccountSummaries.push(
      deepClean({
        description: snapshotSummaryCombinationDocument.tempPageDescription,
        id: id ? Number.parseInt(id) : undefined,
        notFound: snapshotSummaryCombinationDocument.tempPageNotFound,
        numberOfPosts:
          snapshotSummaryCombinationDocument.tempRawVkPosts?.length,
        title: snapshotSummaryCombinationDocument.tempPageTitle,
        titleInfo: snapshotSummaryCombinationDocument.tempPageTitleInfo,
        url: snapshotSummaryCombinationDocument.webPageUrl,
        verified: snapshotSummaryCombinationDocument.tempPageVerified,
      }),
    );
  }

  const vkPostSelection: VkAccountSelection = {
    generatedAt: serializeTime(),
    numberOfScannedAccounts: numberOfScannedVkAccounts,
    accountSummaries: vkAccountSummaries,
  };

  output.write(` Accounts scanned: ${chalk.blue(numberOfScannedVkAccounts)}\n`);

  output.write(chalk.green("Saving result..."));
  await writeFormattedJson(outputFilePath, vkPostSelection);
  output.write(` Done: ${chalk.magenta(outputFilePath)}\n`);
};

await script();
