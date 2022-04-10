import path from "node:path";

import { getWebPagesDirPath } from "../collection";
import { UserFriendlyError } from "../errors";
import { assertWebPageUrlVendor } from "./shared/assert-web-page-url-vendor";
import { MatchWebPageUrl, WebPageVendor } from "./types";

const matchVkUrl: MatchWebPageUrl = (url) =>
  Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(url));

const extractPathSegments = (url: string): string[] => {
  const slug = url.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, wallOrPhoto, accountId, postId] =
      slug.match(/^(wall|photo)(-?\d+)_(\d+)$/) ?? [];

    if (wallOrPhoto && accountId && postId) {
      return [wallOrPhoto === "wall" ? "posts" : "photos", accountId, postId];
    }

    // https://vk.com/faq18038
    return ["accounts", slug];
  }

  return [];
};

export const vkWebPageVendor: WebPageVendor = {
  listUrlExamples: () => [
    "https://vk.com/group123",
    "https://vk.com/id123",
    "https://vk.com/photo-123-456",
    "https://vk.com/public123",
    "https://vk.com/something",
    "https://vk.com/wall-123-456",
  ],

  matchWebPageUrl: matchVkUrl,

  generateWebPageDirPath: (url) => {
    assertWebPageUrlVendor(url, matchVkUrl);

    const pathSegments = extractPathSegments(url);
    if (pathSegments.length === 0) {
      throw new UserFriendlyError(
        `URL ${url} is not canonical or is not supported for VK.`,
      );
    }

    return path.resolve(getWebPagesDirPath(), "vk", ...pathSegments);
  },

  listWebPageAliases: (url) => {
    assertWebPageUrlVendor(url, matchVkUrl);

    return [url.replace("//vk", "//m.vk")];
  },
};
