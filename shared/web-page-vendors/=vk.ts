import { DateTime } from "luxon";
import path from "node:path";

import { getWebPagesDirPath } from "../collection";
import { UserFriendlyError } from "../errors";
import { serializeTime } from "../helpers-for-json";
import { assertWebPageUrlVendor } from "./shared/assert-web-page-url-vendor";
import { MatchWebPageUrl, WebPageVendor } from "./types";

const matchVkUrl: MatchWebPageUrl = (url) =>
  Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(url));

const extractPathSegments = (url: string): string[] => {
  const slug = url.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, wallOrPhoto, accountId, postId] =
      slug.match(/^(wall)(-?\d+)_(\d+)$/) ?? [];

    if (wallOrPhoto && accountId && postId) {
      return ["posts", accountId, postId];
    }

    // https://vk.com/faq18038
    return ["accounts", slug];
  }

  return [];
};

export const vkWebPageVendor: WebPageVendor = {
  checkIfNewSnapshotIsDue: (webPageUrl, mostRecentSnapshotTime) => {
    assertWebPageUrlVendor(webPageUrl, matchVkUrl);

    return (
      // @todo improve based on page type and snapshot summary combination
      serializeTime(DateTime.utc().minus({ days: 2 })) > mostRecentSnapshotTime
    );
  },

  generateWebPageDirPath: (webPageUrl) => {
    assertWebPageUrlVendor(webPageUrl, matchVkUrl);

    const pathSegments = extractPathSegments(webPageUrl);
    if (pathSegments.length === 0) {
      throw new UserFriendlyError(
        `URL ${webPageUrl} is not canonical or is not supported for VK.`,
      );
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
