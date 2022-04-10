import { UserFriendlyError } from "../errors";
import { vkWebPageVendor } from "./vendors/=vk";
import { WebPageVendor } from "./vendors/types";

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

  throw new UserFriendlyError(`URL ${url} is not supported.`);
};
