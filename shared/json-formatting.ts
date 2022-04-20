import fs from "fs-extra";
import path from "node:path";
import sleep from "sleep-promise";

export const formatJson = (object: unknown): string => {
  return `${JSON.stringify(object, undefined, "\t")}\n`;
};

const fileLockByPath: Record<string, true> = {};

export const writeFormattedJson = async (filePath: string, object: unknown) => {
  const resolvedPath = path.resolve(filePath);

  while (fileLockByPath[resolvedPath]) {
    await sleep(10);
  }

  try {
    fileLockByPath[resolvedPath] = true;
    await fs.mkdirp(path.dirname(filePath));
    await fs.writeFile(filePath, formatJson(object), "utf8");
  } finally {
    delete fileLockByPath[resolvedPath];
  }
};
