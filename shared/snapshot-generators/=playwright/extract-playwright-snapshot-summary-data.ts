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
        const text = post.querySelector(".wall_post_text")?.textContent;

        if (localUrl && date && text) {
          tempRawVkPosts.push({ url: `https://vk.com${localUrl}`, date, text });
        }
      }

      return {
        ...(body.querySelector("h1 .page_verified")
          ? { tempPageVerified: true }
          : {}),
        tempRawVkPosts,
      };
    });
  };
