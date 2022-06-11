import { CheckContentMatch } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";
import { extractPostSummaryFromFeedSummary } from "./extract-post-summary-from-feed-summary";

export const checkVkContentMatch: CheckContentMatch = async ({
  webPageDocument,
  contentRegex,
}) => {
  const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);

  // @todo Implement content matching for VK feeds
  if (categorizedVkUrl.vkPageType !== "post") {
    return false;
  }

  const postSummaryInFeed = await extractPostSummaryFromFeedSummary(
    webPageDocument.webPageUrl,
  );

  return Boolean(postSummaryInFeed?.text.match(contentRegex));
};
