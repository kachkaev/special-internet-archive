import * as envalid from "envalid";
import path from "node:path";

import { cleanEnv } from "./clean-env";

export const getCollectionDirPath = (): string => {
  const env = cleanEnv({
    COLLECTION_DIR_PATH: envalid.str({
      desc: "Location of archive collection (path to directory)",
      example: "../data/collections/COLLECTION_NAME",
    }),
  });

  return path.resolve(env.COLLECTION_DIR_PATH);
};

export const getWebPagesDirPath = (): string =>
  path.resolve(getCollectionDirPath(), "web-pages");

export const relevantTimeMin = "2022-02-20T00:00:00Z";
