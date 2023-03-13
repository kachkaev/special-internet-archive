import { deepClean } from "../../deep-clean";
import { TempRawVkPhotoInAlbum, TempRawVkPost } from "../../snapshot-summaries";
import { ExtractSnapshotSummaryData } from "../types";
import { evaluateLastSnapshotInTrace } from "./traces";

export const parseNumberOfFollowers = (
  text: string | undefined,
): number | undefined => {
  const trimmedText = text?.trim();
  if (!trimmedText) {
    return undefined;
  }

  const [, rawNumber, suffix] =
    trimmedText.match(/^([\d ,.]+)([KMКМ])?$/) ?? [];
  if (!rawNumber) {
    return undefined;
  }

  const multiplier =
    suffix === "K" || suffix === "К"
      ? 1000
      : suffix === "M" || suffix === "М"
      ? 1_000_000
      : 1;

  const decimalSeparator = suffix === "К" || suffix === "М" ? "," : ".";

  return (
    Number.parseFloat(
      rawNumber.replaceAll(/\D/g, (char) =>
        char === decimalSeparator ? "." : "",
      ),
    ) * multiplier
  );
};

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
        const imageUrl = style?.match(/url\((.+)\)/)?.[1];

        if (id && imageUrl) {
          tempRawVkPhotosInAlbum.push({
            url: `https://vk.com/photo${id}`,
            imageUrl,
          });
        }
      }

      const tempRawVkPosts: TempRawVkPost[] = [];
      for (const post of body.querySelectorAll(".post")) {
        // First selector is used for snapshots made before approx. 2023-02-05
        const postLinkNode = post.querySelector(
          ".post_link, .PostHeaderSubtitle__link",
        );
        const localUrl = postLinkNode?.getAttribute("href");
        const date = postLinkNode?.textContent?.trim();
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

      const tempNumberOfFollowers = parseNumberOfFollowers(
        (
          body.querySelector(".redesigned-group-subscribers span") ??
          body.querySelector(".group_friends_count") ??
          body.querySelector(".counts_module .page_counter .count") ??
          body.querySelector(".header_count")
        )?.textContent ?? undefined,
      );

      const tempPageVerified = body.querySelector("h1 .page_verified")
        ? true
        : undefined;

      const tempPageTitle = body.querySelector("h1")?.textContent?.trim();

      const tempPageTitleInfo = body
        .querySelector("#page_current_info")
        ?.textContent?.trim();

      return {
        ...deepClean({
          tempNumberOfFollowers,
          tempPageDescription,
          tempPageTitle,
          tempPageTitleInfo,
          tempPageVerified,
        }),

        // https://github.com/angus-c/just/issues/517
        ...(tempRawVkPhotosInAlbum.length > 0
          ? { tempRawVkPhotosInAlbum }
          : undefined),
        ...(tempRawVkPosts.length > 0 ? { tempRawVkPosts } : undefined),
      };
    });
  };
