import path from "node:path";

import * as envalid from "envalid";
import fs from "fs-extra";

import { cleanEnv } from "./clean-env";
import { UserFriendlyError } from "./errors";
import { isUrl } from "./urls";

export const parseUrlInboxRow = (row: string): UrlInboxRecord => {
  const [url, comment] = row.trim().split(/ /, 1);
  if (url && isUrl(url)) {
    const trimmedComment = comment?.trim();

    return {
      type: "url",
      text: row,
      url,
      ...(trimmedComment?.length ? { comment: trimmedComment } : {}),
    };
  }

  return { type: "other", text: row };
};

export const getCollectionDirPath = (): string => {
  const env = cleanEnv({
    COLLECTION_DIR_PATH: envalid.str({
      desc: "Location of archive collection (path to directory)",
      example: "../data/collections/my-collection",
    }),
  });

  return path.resolve(env.COLLECTION_DIR_PATH);
};

export const getWebPagesDirPath = (): string =>
  path.resolve(getCollectionDirPath(), "web-pages");

export const getUrlInboxFilePath = (): string =>
  path.resolve(getCollectionDirPath(), "url-inbox.txt");

export const relevantTimeMin = "2021-12-25T00:00:00Z";

export type UrlInboxUrlRecord = {
  type: "url";
  text: string;
  url: string;
  comment?: string;
};

export type UrlInboxRecord =
  | UrlInboxUrlRecord
  | { type: "other"; text: string };

export const readUrlInboxRecords = async (): Promise<
  UrlInboxRecord[] | undefined
> => {
  const filePath = getUrlInboxFilePath();

  try {
    const fileContents = await fs.readFile(filePath, "utf8");

    if (fileContents.trim().length === 0) {
      return undefined;
    }

    return fileContents
      .split(/\r?\n/g)
      .map<UrlInboxRecord>((row) => parseUrlInboxRow(row));
  } catch {
    throw new UserFriendlyError(
      "Unable tor read URL inbox. Try running `yarn exe yarn exe scripts/2-registration/1-ensure-url-inbox-exists.script.ts` first.",
    );
  }
};

export const writeUrlInbox = async (lines: string[]) => {
  await fs.writeFile(
    getUrlInboxFilePath(),
    lines.join("\n") + // add trailing newline if needed
      (lines.at(-1) === "" ? "\n" : ""),
  );
};
