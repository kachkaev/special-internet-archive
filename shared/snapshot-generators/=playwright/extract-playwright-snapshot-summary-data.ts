import { deepClean } from "../../deep-clean";
import { TempRawVkPhotoInAlbum, TempRawVkPost } from "../../snapshot-summaries";
import { ExtractSnapshotSummaryData } from "../types";
import { evaluateLastSnapshotInTrace } from "./traces";

export const extractPlaywrightSnapshotSummaryData: ExtractSnapshotSummaryData =
  async ({ snapshotFilePath }) => {
    return await evaluateLastSnapshotInTrace(snapshotFilePath, (body) => {
      if (body.style.backgroundImage.includes("error404.png")) {
        return { tempPageNotFound: true };
      }

      const tempRawVkPhotosInAlbum: TempRawVkPhotoInAlbum[] = [];
      for (const photoInAlbum of body.querySelectorAll<HTMLElement>(
        ".photos_container_grid .photos_row",
      )) {
        const id = photoInAlbum.dataset["id"];
        const style = photoInAlbum.getAttribute("style");
        const imageUrl = style?.match(/url\("(.+)"\)/)?.[1];

        if (id && imageUrl) {
          tempRawVkPhotosInAlbum.push({
            url: `https://vk.com/photo${id}`,
            imageUrl,
          });
        }
      }

      const tempRawVkPosts: TempRawVkPost[] = [];
      for (const post of body.querySelectorAll(".post")) {
        const postLinkNode = post.querySelector(".post_link");
        const localUrl = postLinkNode?.getAttribute("href");
        const date = postLinkNode?.textContent;
        const text = [...post.querySelectorAll(".wall_post_text")]
          .map((node) => node.textContent)
          .join("\n")
          .trim();
        const ad = Boolean(post.querySelector(".wall_marked_as_ads"));

        if (localUrl && date) {
          tempRawVkPosts.push({
            url: `https://vk.com${localUrl}`,
            date,
            text,
            ...(ad ? { ad } : undefined),
          });
        }
      }

      const tempPageDescription = body
        .querySelector(".group_info_row.info")
        ?.textContent?.trim();

      const tempPageVerified = body.querySelector("h1 .page_verified")
        ? true
        : undefined;

      const tempPageTitle = body.querySelector("h1")?.textContent?.trim();

      const tempPageTitleInfo = body
        .querySelector("#page_current_info")
        ?.textContent?.trim();

      return {
        ...deepClean({
          tempPageVerified,
          tempPageDescription,
          tempPageTitle,
          tempPageTitleInfo,
        }),

        ...(tempRawVkPhotosInAlbum.length > 0
          ? { tempRawVkPhotosInAlbum }
          : undefined),

        ...(tempRawVkPosts.length > 0 ? { tempRawVkPosts } : undefined),
      };
    });
  };
