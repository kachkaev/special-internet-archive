import chalk from "chalk";
// eslint-disable-next-line import/no-unresolved -- https://github.com/adaltas/node-csv/issues/323
import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import _ from "lodash";

import {
  generateCollectionCatalogSeedUrlInboxFilePath,
  getCollectionCatalogSeedFilePath,
  getCollectionCatalogSeedUrlInboxesDirPath,
} from "../../../shared/collection-catalog";
import { UserFriendlyError } from "../../../shared/errors";
import { reportGithubMessageIfNeeded } from "../../../shared/github";
import { checkIfWebPageUrlIsAcceptable } from "../../../shared/web-page-sources";

const output = process.stdout;

interface Item {
  collectionId: string;
  ready: boolean;
  rowIndex: number;
  url: string;
}

const findColumnIndex = (
  headerCells: string[],
  lowerCaseMatches: string[],
): number => {
  for (const [index, headerCell] of headerCells.entries()) {
    if (lowerCaseMatches.includes(headerCell.toLowerCase())) {
      return index;
    }
  }

  throw new UserFriendlyError(
    `Could not find a column with header "${lowerCaseMatches.join('", "')}"`,
  );
};

const parseBoolean = (rawValue: string | undefined): boolean => {
  return rawValue ? ["1", "TRUE"].includes(rawValue) : false;
};

const script = async () => {
  output.write(chalk.bold(`Generating collection catalog seed URL inboxes\n`));

  const reportWarning = (message: string) => {
    if (
      !reportGithubMessageIfNeeded({ messageType: "warning", output, message })
    ) {
      output.write(chalk.yellow(`${message}\n`));
    }
  };

  const downloadFilePath = getCollectionCatalogSeedFilePath();
  if (!(await fs.pathExists(downloadFilePath))) {
    throw new UserFriendlyError(
      `Please download or create seed CSV file. It should be located at ${downloadFilePath}`,
    );
  }

  const download = await fs.readFile(downloadFilePath, "utf8");

  const [headerCells, ...rows] = parse(download, {
    delimiter: ",",
  }) as [string[], ...string[][]];

  const columnIndexWithUrl = findColumnIndex(headerCells, ["ссылка"]);
  const columnIndexWithCollectionId = findColumnIndex(headerCells, [
    "collection id",
  ]);
  const columnIndexWithReady = findColumnIndex(headerCells, ["ready"]);

  const items: Item[] = [];

  for (const [rawRowIndex, cells] of rows.entries()) {
    const rowIndex = rawRowIndex + 2; // header + zero-based indexing
    const url = cells[columnIndexWithUrl];
    const collectionId = cells[columnIndexWithCollectionId];
    const ready = parseBoolean(cells[columnIndexWithReady]);

    if (!url) {
      continue;
    }

    if (!checkIfWebPageUrlIsAcceptable(url)) {
      reportWarning(
        `Skipping row ${rowIndex} because URL cannot be accepted: ${url}`,
      );
      continue;
    }

    if (!collectionId) {
      if (ready) {
        output.write(
          chalk.gray(
            `Skipping row ${rowIndex} because URL ${url} does not have an assigned collection\n`,
          ),
        );
      }
      continue;
    }

    items.push({ collectionId, ready, rowIndex, url });
  }

  const itemsGroupedByUrl = _.groupBy(items, (item) => item.url);
  const readyUrlsByCollectionId: Record<string, string[]> = {};
  for (const [url, itemsInGroup] of Object.entries(itemsGroupedByUrl)) {
    if (itemsInGroup.length > 1) {
      reportWarning(
        `Ignoring URL ${url} as it appears multiple times (rows ${itemsInGroup
          .map((item) => item.rowIndex)
          .join(", ")})`,
      );
      continue;
    }
    const { collectionId, ready } = itemsInGroup[0]!;
    if (ready) {
      readyUrlsByCollectionId[collectionId] ??= [];
      readyUrlsByCollectionId[collectionId]?.push(url);
    }
  }

  const seedUrlInboxesDirPath = getCollectionCatalogSeedUrlInboxesDirPath();
  await fs.remove(seedUrlInboxesDirPath);
  await fs.ensureDir(seedUrlInboxesDirPath);

  for (const [collectionId, urls] of Object.entries(readyUrlsByCollectionId)) {
    await fs.writeFile(
      generateCollectionCatalogSeedUrlInboxFilePath(collectionId),
      `${_.orderBy(urls).join("\n")}\n`,
      "utf8",
    );
  }
  output.write(
    `Number of seed URL inboxes created: ${
      Object.keys(readyUrlsByCollectionId).length
    }. Location: ${seedUrlInboxesDirPath}\n`,
  );
};

await script();
