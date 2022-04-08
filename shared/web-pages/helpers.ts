import path from "node:path";

import { getWebPageVendor } from "./vendors";

export const generateWebPageDirPath = (url: string): string => {
  return getWebPageVendor(url).generateWebPageDirPath(url);
};

export const generateWebPageFilePath = (url: string): string => {
  return path.resolve(generateWebPageDirPath(url), "web-page.json");
};

export const listWebPageAliases = (url: string): string[] => {
  return getWebPageVendor(url).listWebPageAliases(url);
};
