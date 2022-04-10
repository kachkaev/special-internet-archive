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
