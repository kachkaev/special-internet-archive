import { assertGenericUrl } from "./=generic/assert-generic-url";
import { checkIfNewGenericSnapshotIsDue } from "./=generic/check-if-new-generic-snapshot-is-due";
import { convertUrlHostToSurtFormat } from "./=generic/convert-url-host-to-surt-format";
import { getVkWebPageCreationTime } from "./=vk/get-vk-web-page-creation-time";
import { interactWithVkPlaywrightPage } from "./=vk/interact-with-vk-playwright-page";
import { generateUncategorisedUrlPathSegment } from "./shared/generate-uncategorised-url-path-segment";
import { WebPageSource } from "./types";

export const genericWebPageSource: WebPageSource = {
  assertWebPageUrl: assertGenericUrl,

  checkContentMatch: () => false,
  checkIfSnapshotIsDue: checkIfNewGenericSnapshotIsDue,

  generateWebPageDirPathSegments: (webPageUrl) => {
    return [
      "generic",
      convertUrlHostToSurtFormat(webPageUrl),
      "-",
      generateUncategorisedUrlPathSegment(webPageUrl),
    ];
  },

  getWebPageCreationTime: getVkWebPageCreationTime,

  interactWithPlaywrightPage: interactWithVkPlaywrightPage,

  listUrlExamples: () => [
    "https://example.com",
    "https://example.org/anything?any-param=any-value#any-hash",
  ],

  listWebPageAliases: () => {
    return [];
  },
};
