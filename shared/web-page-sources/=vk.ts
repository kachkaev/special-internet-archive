import path from "node:path";

import { getWebPagesDirPath } from "../collection";
import { assertVkUrl } from "./=vk/assert-vk-url";
import { calculateRelevantTimeMinForNewIncrementalVkSnapshot } from "./=vk/calculate-relevant-time-min-for-mew-incremental-vk-snapshot";
import { categorizeVkUrl } from "./=vk/categorize-vk-url";
import { checkIfNewVkSnapshotIsDue } from "./=vk/check-if-new-vk-snapshot-is-due";
import { interactWithVkPlaywrightPage } from "./=vk/interact-with-vk-playwright-page";
import { WebPageSource } from "./types";

export const vkWebPageSource: WebPageSource = {
  calculateRelevantTimeMinForNewIncrementalSnapshot:
    calculateRelevantTimeMinForNewIncrementalVkSnapshot,

  checkIfSnapshotIsDue: checkIfNewVkSnapshotIsDue,

  generateWebPageDirPath: (webPageUrl) => {
    assertVkUrl(webPageUrl);

    let pathSegments: string[];
    const categorizedVkUrl = categorizeVkUrl(webPageUrl);
    switch (categorizedVkUrl.vkPageType) {
      case "account":
        pathSegments = ["accounts", categorizedVkUrl.accountId];
        break;

      case "post":
        pathSegments = [
          "posts",
          categorizedVkUrl.accountId,
          categorizedVkUrl.postId,
        ];
        break;
    }

    return path.resolve(getWebPagesDirPath(), "vk", ...pathSegments);
  },

  interactWithPlaywrightPage: interactWithVkPlaywrightPage,

  listUrlExamples: () => [
    "https://vk.com/group123",
    "https://vk.com/id123",
    "https://vk.com/public123",
    "https://vk.com/something",
    "https://vk.com/wall-123-456",
  ],

  listWebPageAliases: (webPageUrl) => {
    assertVkUrl(webPageUrl);

    return [webPageUrl.replace("//vk", "//m.vk")];
  },

  assertWebPageUrl: assertVkUrl,
};
