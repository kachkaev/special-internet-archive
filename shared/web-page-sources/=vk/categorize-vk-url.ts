import { UserFriendlyError } from "../../errors";
import { uncategorizedVkPagesAreEnabled } from "../../experiments";
import { assertVkUrl } from "./assert-vk-url";

export type CategorizedVkUrl =
  | {
      vkPageType: "account";
      accountSlug: string;
    }
  | {
      vkPageType: "album" | "albumComments" | "photo" | "photoRev" | "post";
      accountId: string;
      itemId: string; // can be 00, e.g. in https://vk.com/albumNNN_00 for all wall post photos
    }
  | {
      vkPageType: "uncategorized";
      url: string;
    };

export const categorizeVkUrl = (webPageUrl: string): CategorizedVkUrl => {
  assertVkUrl(webPageUrl);

  {
    const [, accountId, itemId] =
      webPageUrl.match(/^https:\/\/vk.com\/photo(-?\d+)_(\d+)\?rev=1$/) ?? [];
    if (accountId && itemId) {
      return {
        vkPageType: "photoRev",
        accountId,
        itemId,
      };
    }
  }

  {
    const [, accountId, itemId] =
      webPageUrl.match(
        /^https:\/\/vk.com\/album(-?\d+)_(\d+)\?act=comments$/,
      ) ?? [];
    if (accountId && itemId) {
      return {
        vkPageType: "albumComments",
        accountId,
        itemId,
      };
    }
  }

  const slug = webPageUrl.match(/^https:\/\/vk.com\/([\d._a-z-]+)$/)?.[1];

  if (slug) {
    const [, prefix, accountId, itemId] =
      slug.match(/^(album|photo|wall)(-?\d+)_(\d+)$/) ?? [];

    if (prefix && accountId && itemId) {
      switch (prefix) {
        case "album":
        case "photo": {
          return {
            vkPageType: prefix,
            accountId,
            itemId,
          };
        }
        case "wall": {
          return {
            vkPageType: "post",
            accountId,
            itemId,
          };
        }
        default: {
          throw new Error(`Unexpected prefix: ${prefix}`);
        }
      }
    }

    // @todo Improve slug check via https://vk.com/faq18038
    if (!/^(video|event)-?\d/.test(slug)) {
      return { vkPageType: "account", accountSlug: slug };
    }
  }

  if (uncategorizedVkPagesAreEnabled) {
    return { vkPageType: "uncategorized", url: webPageUrl };
  }

  throw new UserFriendlyError(
    `URL ${webPageUrl} is not canonical or is not currently supported for VK`,
  );
};
