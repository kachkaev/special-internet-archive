import { UserFriendlyError } from "./errors";
import { vkWebPageVendor } from "./web-page-vendors/=vk";
import { WebPageVendor } from "./web-page-vendors/types";

export const webPageVendorLookup = {
  vk: vkWebPageVendor,
};

type WebPageVendorId = keyof typeof webPageVendorLookup;

export const getWebPageVendor = (url: string): WebPageVendor => {
  for (const webpageVendorId in webPageVendorLookup) {
    if (Object.hasOwn(webPageVendorLookup, webpageVendorId)) {
      const webPageVendor =
        webPageVendorLookup[webpageVendorId as WebPageVendorId];

      if (webPageVendor.matchWebPageUrl(url)) {
        return webPageVendor;
      }
    }
  }

  throw new UserFriendlyError(`URL ${url} is invalid or is not supported.`);
};

export const generateWebPageDirPath = (url: string): string => {
  return getWebPageVendor(url).generateWebPageDirPath(url);
};

export const listWebPageAliases = (url: string): string[] => {
  return getWebPageVendor(url).listWebPageAliases(url);
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageVendorLookup)
    .flatMap((vendor) => vendor.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
