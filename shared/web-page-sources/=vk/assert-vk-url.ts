import { generateAssertWebPageUrlSource } from "../shared/generate-assert-web-page-url-source";
import { AssertSourceUrl } from "../types";

export const assertVkUrl: AssertSourceUrl = generateAssertWebPageUrlSource(
  (webPageUrl) => Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(webPageUrl)),
);
