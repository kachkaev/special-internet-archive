import { UserFriendlyError } from "../user-friendly-error";
import { vkWebPageVendor } from "./vendors/=vk";
import { generateUrlExamplesMessage } from "./vendors/shared/generate-url-examples-message";
import { WebPageVendor } from "./vendors/types";

const webPageVendorLookup = {
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

  const urlExamples = Object.values(webPageVendorLookup)
    .flatMap((vendor) => vendor.listUrlExamples())
    .sort();

  throw new UserFriendlyError(
    `URL ${url} is not supported. ${generateUrlExamplesMessage(urlExamples)}`,
  );
};
