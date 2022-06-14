import { TempRawVkPost } from "../../snapshot-summaries";
import { ExtractSnapshotSummaryData } from "../types";
import { evaluateLastSnapshotInTrace } from "./traces";

export const extractPlaywrightSnapshotSummaryData: ExtractSnapshotSummaryData =
  async ({ snapshotFilePath }) => {
    const tempRawVkPosts = await evaluateLastSnapshotInTrace(
      snapshotFilePath,
      (body) => {
        const result: TempRawVkPost[] = [];
        for (const post of body.querySelectorAll(".post")) {
          const postLinkNode = post.querySelector(".post_link");
          const localUrl = postLinkNode?.getAttribute("href");
          const date = postLinkNode?.textContent;
          const text = post.querySelector(".wall_post_text")?.textContent;

          if (localUrl && date && text) {
            result.push({ url: `https://vk.com${localUrl}`, date, text });
          }
        }

        return result;
      },
    );

    return {
      tempRawVkPosts,
    };
  };
