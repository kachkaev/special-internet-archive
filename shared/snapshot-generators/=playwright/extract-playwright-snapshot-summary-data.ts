import { TempRawVkPost } from "../../snapshot-summaries";
import { ExtractSnapshotSummaryData } from "../types";
import { evaluateSnapshot, gotoLastAction, openTrace } from "./traces";

export const extractPlaywrightSnapshotSummaryData: ExtractSnapshotSummaryData =
  async ({ snapshotFilePath }) => {
    const tracePage = await openTrace(snapshotFilePath);

    await gotoLastAction(tracePage);

    const tempRawVkPosts = await evaluateSnapshot(tracePage, (body) => {
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
    });

    await tracePage.close();

    return {
      tempRawVkPosts,
    };
  };
