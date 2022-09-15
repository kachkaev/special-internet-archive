import { TempRawVkPost } from "../../snapshot-summaries";
import { ExtractSnapshotSummaryData } from "../types";
import { evaluateLastSnapshotInTrace } from "./traces";

export const extractPlaywrightSnapshotSummaryData: ExtractSnapshotSummaryData =
  async ({ snapshotFilePath }) => {
    return await evaluateLastSnapshotInTrace(snapshotFilePath, (body) => {
      if (body.style.backgroundImage.includes("error404.png")) {
        return { tempPageNotFound: true };
      }

      const tempRawVkPosts: TempRawVkPost[] = [];
      for (const post of body.querySelectorAll(".post")) {
        const postLinkNode = post.querySelector(".post_link");
        const localUrl = postLinkNode?.getAttribute("href");
        const date = postLinkNode?.textContent;
        const text = post.querySelector(".wall_post_text")?.textContent ?? "";
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

      const tempPageVerified = Boolean(body.querySelector("h1 .page_verified"));

      const tempPageTitle = body.querySelector("h1")?.textContent?.trim();

      const tempPageTitleInfo = body
        .querySelector("#page_current_info")
        ?.textContent?.trim();

      return {
        ...(tempPageVerified ? { tempPageVerified } : {}),
        ...(tempPageDescription ? { tempPageDescription } : {}),
        ...(tempPageTitle ? { tempPageTitle } : {}),
        ...(tempPageTitleInfo ? { tempPageTitleInfo } : {}),
        tempRawVkPosts,
      };
    });
  };
