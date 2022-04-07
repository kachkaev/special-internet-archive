import * as envalid from "envalid";
import path from "node:path";

import { cleanEnv } from "./clean-env";

export const getArchiveCollectionDirPath = (): string => {
  const env = cleanEnv({
    ARCHIVE_COLLECTION_DIR_PATH: envalid.str({
      desc: "Location of archive collection (path to directory)",
      example: "../archive-collections/my-collection-name",
    }),
  });

  return path.resolve(env.ARCHIVE_COLLECTION_DIR_PATH);
};

export const getWebPagesDirPath = (): string =>
  path.resolve(getArchiveCollectionDirPath(), "web-pages");
