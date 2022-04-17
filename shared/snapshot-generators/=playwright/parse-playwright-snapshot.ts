import { ExtractSnapshotSummaryData } from "../types";
import { evaluateSnapshot, gotoLastAction, openTrace } from "./traces";

export const parsePlaywrightSnapshot: ExtractSnapshotSummaryData = async ({
  snapshotFilePath,
}) => {
  const tracePage = await openTrace(snapshotFilePath);

  await gotoLastAction(tracePage);

  const rawPosts = await evaluateSnapshot(tracePage, (body) => {
    const result = [];
    for (const post of body.querySelectorAll(".post")) {
      const postLink = post.querySelector(".post_link");
      result.push({
        url: postLink?.getAttribute("href"),
        date: postLink?.textContent,
        text: post.querySelector(".wall_post_text")?.textContent,
      });
    }

    return result;
  });

  await tracePage.close();

  return {
    rawPosts,
  };
};
