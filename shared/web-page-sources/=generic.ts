import { assertGenericUrl } from "./=generic/assert-generic-url";
import { checkIfNewGenericSnapshotIsDue } from "./=generic/check-if-new-generic-snapshot-is-due";
import { convertUrlHostToSurtFormat } from "./=generic/convert-url-host-to-surt-format";
import { generateUncategorisedUrlPathSegment } from "./shared/generate-uncategorised-url-path-segment";
import { WebPageSource } from "./types";

export const genericWebPageSource: WebPageSource = {
  assertWebPageUrl: assertGenericUrl,

  checkContentMatch: () => false,
  checkIfNewSnapshotIsDue: checkIfNewGenericSnapshotIsDue,

  generateWebPageDirPathSegments: (webPageUrl) => {
    return [
      "generic",
      convertUrlHostToSurtFormat(webPageUrl),
      "-",
      generateUncategorisedUrlPathSegment(webPageUrl),
    ];
  },

  listUrlExamples: () => [
    "https://example.com",
    "https://example.org/anything?any-param=any-value#any-hash",
  ],

  listWebPageAliases: () => {
    return [];
  },
};
