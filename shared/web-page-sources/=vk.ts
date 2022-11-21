import _ from "lodash";

import { assertVkUrl } from "./=vk/assert-vk-url";
import { calculateRelevantTimeMinForNewIncrementalVkSnapshot } from "./=vk/calculate-relevant-time-min-for-mew-incremental-vk-snapshot";
import { categorizeVkUrl } from "./=vk/categorize-vk-url";
import { checkIfNewVkSnapshotIsDue } from "./=vk/check-if-new-vk-snapshot-is-due";
import { checkVkContentMatch } from "./=vk/check-vk-content-match";
import { getVkWebPageCreationTime } from "./=vk/get-vk-web-page-creation-time";
import { interactWithVkPlaywrightPage } from "./=vk/interact-with-vk-playwright-page";
import { WebPageSource } from "./types";

export const vkWebPageSource: WebPageSource = {
  assertWebPageUrl: assertVkUrl,

  calculateRelevantTimeMinForNewIncrementalSnapshot:
    calculateRelevantTimeMinForNewIncrementalVkSnapshot,

  checkContentMatch: checkVkContentMatch,
  checkIfSnapshotIsDue: checkIfNewVkSnapshotIsDue,

  generateWebPageDirPathSegments: (webPageUrl) => {
    const categorizedVkUrl = categorizeVkUrl(webPageUrl);

    let pathSegments: string[];
    switch (categorizedVkUrl.vkPageType) {
      case "account": {
        pathSegments = ["accounts", categorizedVkUrl.accountSlug];
        break;
      }
      case "albumComments": {
        pathSegments = [
          _.kebabCase(categorizedVkUrl.vkPageType),
          `${categorizedVkUrl.accountId}`,
          `${categorizedVkUrl.itemId}`,
        ];
        break;
      }

      case "album":
      case "photo":
      case "post": {
        pathSegments = [
          `${categorizedVkUrl.vkPageType}s`,
          `${categorizedVkUrl.accountId}`,
          `${categorizedVkUrl.itemId}`,
        ];
        break;
      }
    }

    return ["vk", ...pathSegments];
  },

  getWebPageCreationTime: getVkWebPageCreationTime,

  interactWithPlaywrightPage: interactWithVkPlaywrightPage,

  listUrlExamples: () => [
    "https://vk.com/group123",
    "https://vk.com/id123",
    "https://vk.com/public123",
    "https://vk.com/something",
    "https://vk.com/album-123-456",
    "https://vk.com/album-123-456?act=comments",
    "https://vk.com/photo-123-456",
    "https://vk.com/wall-123-456",
  ],

  listWebPageAliases: (webPageUrl) => {
    assertVkUrl(webPageUrl);

    return [webPageUrl.replace("//vk", "//m.vk")];
  },
};
