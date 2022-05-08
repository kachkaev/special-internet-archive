import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";

import { cleanEnv } from "../../../shared/clean-env";
import {
  getCollectionCatalogDirPath,
  getCollectionCatalogSeedFilePath,
} from "../../../shared/collection-catalog";
import { UserFriendlyError } from "../../../shared/errors";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold(`Downloading collection catalog seed file\n`));

  const collectionCatalogDirPath = getCollectionCatalogDirPath();
  await fs.ensureDir(collectionCatalogDirPath);

  const env = cleanEnv({
    COLLECTION_CATALOG_UPSTREAM_SEED_URL: envalid.url({
      example: "https://docs.google.com/spreadsheets/d/[sheet-id]",
    }),
  });

  const upstreamSeedUrl = env.COLLECTION_CATALOG_UPSTREAM_SEED_URL;

  const googleSheetId = upstreamSeedUrl.match(
    /^https:\/\/docs.google.com\/spreadsheets\/d\/([\w-]+)/i,
  )?.[1];

  if (!googleSheetId) {
    throw new UserFriendlyError(
      `Unable to extract google sheet id from URL "${upstreamSeedUrl}"`,
    );
  }

  const axiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
  });

  const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=csv`;
  const response = await axiosInstance.get<string>(url, {
    responseType: "text",
  });

  if (response.status !== 200) {
    throw new UserFriendlyError(
      `Expected HTTP status to be 200, got ${response.status}. URL: ${url}`,
    );
  }

  const csv = response.data;

  const downloadFilePath = getCollectionCatalogSeedFilePath();
  await fs.writeFile(downloadFilePath, csv, "utf8");
  output.write(`Result saved in ${chalk.green(downloadFilePath)}\n`);
};

await script();
