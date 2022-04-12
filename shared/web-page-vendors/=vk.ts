import { DateTime } from "luxon";
import path from "node:path";

import { getWebPagesDirPath } from "../collection";
import { serializeTime } from "../helpers-for-json";
import { assertWebPageUrlVendor } from "./shared/assert-web-page-url-vendor";
import { categorizeVkUrl } from "./shared/categorize-vk-url";
import { MatchWebPageUrl, WebPageVendor } from "./types";

const matchVkUrl: MatchWebPageUrl = (webPageUrl) =>
  Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(webPageUrl));

export const vkWebPageVendor: WebPageVendor = {
  checkIfNewSnapshotIsDue: ({ webPageUrl, knownSnapshotTimesInAscOrder }) => {
    assertWebPageUrlVendor(webPageUrl, matchVkUrl);

    const mostRecentSnapshotTime = knownSnapshotTimesInAscOrder.at(-1);
    if (!mostRecentSnapshotTime) {
      return true;
    }

    return (
      // @todo improve based on page type and snapshot summary combination
      serializeTime(DateTime.utc().minus({ days: 2 })) > mostRecentSnapshotTime
    );
  },

  generateWebPageDirPath: (webPageUrl) => {
    assertWebPageUrlVendor(webPageUrl, matchVkUrl);

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

  listUrlExamples: () => [
    "https://vk.com/group123",
    "https://vk.com/id123",
    "https://vk.com/public123",
    "https://vk.com/something",
    "https://vk.com/wall-123-456",
  ],

  listWebPageAliases: (url) => {
    assertWebPageUrlVendor(url, matchVkUrl);

    return [url.replace("//vk", "//m.vk")];
  },

  matchWebPageUrl: matchVkUrl,
};
