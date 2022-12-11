import { generateAssertWebPageUrlSource } from "../shared/generate-assert-web-page-url-source";
import { AssertSourceUrl } from "../types";

export const assertGenericUrl: AssertSourceUrl = generateAssertWebPageUrlSource(
  "generic",
  (webPageUrl) => {
    try {
      const parsedUrl = new URL(webPageUrl);
      if (
        ["http", "https"].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password ||
        parsedUrl.port !== ""
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },
);
