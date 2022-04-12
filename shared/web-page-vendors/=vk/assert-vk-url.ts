import { generateAssertWebPageUrlVendor } from "../shared/generate-assert-web-page-url-vendor";
import { AssertVendorUrl } from "../types";

export const assertVkUrl: AssertVendorUrl = generateAssertWebPageUrlVendor(
  (webPageUrl) => Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(webPageUrl)),
);
