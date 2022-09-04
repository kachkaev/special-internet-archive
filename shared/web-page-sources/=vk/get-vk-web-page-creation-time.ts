import { GetWebPageCreationTime } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";
import { extractPostSummaryFromFeedSummary } from "./extract-post-summary-from-feed-summary";

export const getVkWebPageCreationTime: GetWebPageCreationTime = async (
  webPageUrl,
) => {
  const categorizedVkUrl = categorizeVkUrl(webPageUrl);
  if (categorizedVkUrl.vkPageType === "post") {
    const postSummary = await extractPostSummaryFromFeedSummary(webPageUrl);
    if (postSummary) {
      return postSummary.date;
    }
  }

  return;
};
