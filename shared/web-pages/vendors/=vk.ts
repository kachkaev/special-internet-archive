import path from "node:path";

import { getWebPagesDirPath } from "../../archive-collection";
import { UserFriendlyError } from "../../user-friendly-error";
import { assertWebPageUrlVendor } from "../shared/assert-web-page-url-vendor";
import { generateUrlExamplesMessage } from "./shared/generate-url-examples-message";
import { MatchWebPageUrl, WebPageVendor } from "./types";

const matchVkUrl: MatchWebPageUrl = (url) =>
  Boolean(/^https?:\/\/(m\.)?vk\.com(\/.*|)/.test(url));

const urlExamples = [
  "https://vk.com/group123",
  "https://vk.com/id123",
  "https://vk.com/photo-123-456",
  "https://vk.com/public123",
  "https://vk.com/something",
  "https://vk.com/wall-123-456",
];

const extractPathSegments = (url: string): string[] => {
  const slug = url.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, wallOrPhoto, accountId, postId] =
      slug.match(/^(wall|photo)(-?\d+)-(\d+)$/) ?? [];

    if (wallOrPhoto && accountId && postId) {
      return [wallOrPhoto === "wall" ? "posts" : "photos", accountId, postId];
    }

    // https://vk.com/faq18038
    return ["accounts", slug];
  }

  return [];
};

export const vkWebPageVendor: WebPageVendor = {
  listUrlExamples: () => urlExamples,

  matchWebPageUrl: matchVkUrl,

  generateWebPageDirPath: (url) => {
    assertWebPageUrlVendor(url, matchVkUrl);
    const pathSegments = extractPathSegments(url);
    if (pathSegments.length === 0) {
      throw new UserFriendlyError(
        `URL ${url} is not canonical or is not supported for VK. ${generateUrlExamplesMessage(
          urlExamples,
        )}`,
      );
    }

    return path.resolve(getWebPagesDirPath(), "vk", ...pathSegments);
  },
};
