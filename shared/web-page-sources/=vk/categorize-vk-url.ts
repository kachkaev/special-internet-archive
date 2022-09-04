import { UserFriendlyError } from "../../errors";
import { assertVkUrl } from "./assert-vk-url";

export type CategorizedVkUrl =
  | {
      vkPageType: "account";
      accountSlug: string;
    }
  | {
      vkPageType: "post";
      accountId: number;
      postId: number;
    };

export const categorizeVkUrl = (webPageUrl: string): CategorizedVkUrl => {
  assertVkUrl(webPageUrl);

  const slug = webPageUrl.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, rawAccountId, rawPostId] = slug.match(/^wall(-?\d+)_(\d+)$/) ?? [];

    if (rawAccountId && rawPostId) {
      return {
        vkPageType: "post",
        accountId: Number.parseInt(rawAccountId),
        postId: Number.parseInt(rawPostId),
      };
    }

    // @todo Improve slug check via https://vk.com/faq18038
    if (!/^(album|photo|video|event)-?\d/.test(slug)) {
      return { vkPageType: "account", accountSlug: slug };
    }
  }

  throw new UserFriendlyError(
    `URL ${webPageUrl} is not canonical or is not currently supported for VK`,
  );
};
