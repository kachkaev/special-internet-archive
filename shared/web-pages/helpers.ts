import path from "node:path";

import { getWebPageVendor, webPageVendorLookup } from "./vendors";

export const generateWebPageDirPath = (url: string): string => {
  return getWebPageVendor(url).generateWebPageDirPath(url);
};

export const generateWebPageFilePath = (url: string): string => {
  return path.resolve(generateWebPageDirPath(url), "web-page.json");
};

export const listWebPageAliases = (url: string): string[] => {
  return getWebPageVendor(url).listWebPageAliases(url);
};

export const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageVendorLookup)
    .flatMap((vendor) => vendor.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (urlExamples: string[]): string =>
  `Please follow these examples:\n- ${urlExamples.join("\n- ")}\n`;
