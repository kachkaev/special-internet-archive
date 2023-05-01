import { generateAssertWebPageUrlSource } from "../shared/generate-assert-web-page-url-source";
import { AssertSourceUrl } from "../types";

const excludedUrlPatterns = [
  /^https?:\/\/[^/]*airtable(usercontent|)\.com/,
  /^https?:\/\/[^/]*archive\./,
  /^https?:\/\/t\.me\/c\//,
];

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

      for (const excludedUrlPattern of excludedUrlPatterns) {
        if (excludedUrlPattern.test(webPageUrl)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  },
);
