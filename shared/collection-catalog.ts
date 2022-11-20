import path from "node:path";

import * as envalid from "envalid";

import { cleanEnv } from "./clean-env";

export const getCollectionCatalogDirPath = (): string => {
  const env = cleanEnv({
    COLLECTION_CATALOG_DIR_PATH: envalid.str({
      desc: "Location of archive collection catalog (path to directory)",
      default: "../data/collection-catalog",
    }),
  });

  return path.resolve(env.COLLECTION_CATALOG_DIR_PATH);
};

export const getCollectionCatalogSeedFilePath = (): string => {
  return path.resolve(getCollectionCatalogDirPath(), "seed.csv");
};

export const getCollectionCatalogSeedUrlInboxesDirPath = (): string => {
  return path.resolve(getCollectionCatalogDirPath(), "seed-url-inboxes");
};

export const generateCollectionCatalogSeedUrlInboxFilePath = (
  collectionId: string,
): string => {
  return path.resolve(
    getCollectionCatalogSeedUrlInboxesDirPath(),
    `${collectionId}.txt`,
  );
};
