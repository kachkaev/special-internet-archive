import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import path from "node:path";
import { WriteStream } from "node:tty";

import { cleanEnv } from "./clean-env";
import { UserFriendlyError } from "./errors";
import { isUrl } from "./urls";

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

export const getUrlInboxFilePath = (): string =>
  path.resolve(getCollectionDirPath(), "url-inbox.txt");

export const relevantTimeMin = "2022-02-20T00:00:00Z";

export type ParsedUrlInboxRow =
  | { type: "url"; text: string; url: string }
  | { type: "other"; text: string };

export const readUrlInboxRows = async (
  output: WriteStream,
): Promise<ParsedUrlInboxRow[] | undefined> => {
  const filePath = getUrlInboxFilePath();
  output.write(`${chalk.green("File location:")} ${filePath}\n`);

  try {
    const fileContents = await fs.readFile(filePath, "utf8");

    if (fileContents.trim().length === 0) {
      return undefined;
    }

    return fileContents.split(/\r?\n/g).map((text) => {
      const trimmedText = text.trim();
      if (isUrl(trimmedText)) {
        return { type: "url", text, url: trimmedText };
      }

      return { type: "other", text };
    });
  } catch {
    throw new UserFriendlyError(
      "Unable tor read URL inbox file. Try running `yarn exe scripts/web-pages/ensure-url-inbox.script.ts` first.",
    );
  }
};
