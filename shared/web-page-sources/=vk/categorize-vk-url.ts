import { UserFriendlyError } from "../../errors";
import { assertVkUrl } from "./assert-vk-url";

export type CategorizedVkUrl =
  | {
      vkPageType: "account";
      accountId: string;
    }
  | {
      vkPageType: "post";
      accountId: string;
      postId: string;
    };

export const categorizeVkUrl = (webPageUrl: string): CategorizedVkUrl => {
  assertVkUrl(webPageUrl);

  const slug = webPageUrl.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, accountId, postId] = slug.match(/^wall(-?\d+)_(\d+)$/) ?? [];

    if (accountId && postId) {
      return { vkPageType: "post", accountId, postId };
    }

    // @todo Improve slug check via https://vk.com/faq18038
    if (!/^(album|photo)-?\d/.test(slug)) {
      return { vkPageType: "account", accountId: slug };
    }
  }

  throw new UserFriendlyError(
    `URL ${webPageUrl} is not canonical or is not currently supported for VK.`,
  );
};
