import { generateAssertWebPageUrlSource } from "../shared/generate-assert-web-page-url-source";
import { AssertSourceUrl } from "../types";

export const assertVkUrl: AssertSourceUrl = generateAssertWebPageUrlSource(
  "vk",
  (webPageUrl) => Boolean(/^https:vk\.com(\/.*|)/.test(webPageUrl)),
);
