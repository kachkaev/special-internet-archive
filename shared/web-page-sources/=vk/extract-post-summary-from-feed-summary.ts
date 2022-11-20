import path from "node:path";

import sleep from "sleep-promise";

import { getWebPagesDirPath } from "../../collection";
import { processFiles } from "../../process-files";
import {
  readSnapshotSummaryCombinationDocument,
  TempRawVkPost,
} from "../../snapshot-summaries";
import { categorizeVkUrl } from "./categorize-vk-url";

let vkPostSummaryCombinationLookup:
  | Record<string, TempRawVkPost>
  | undefined
  | "loading";

const loadVkPostSummaryCombinationLookup = async (): Promise<
  Record<string, TempRawVkPost>
> => {
  const result: Record<string, TempRawVkPost> = {};

  await processFiles({
    fileSearchDirPath: getWebPagesDirPath(),
    fileSearchPattern: "**/snapshot-summary-combination.json",

    processFile: async (filePath) => {
      const snapshotSummaryCombinationDocument =
        await readSnapshotSummaryCombinationDocument(path.dirname(filePath));

      for (const postSummaryCombination of snapshotSummaryCombinationDocument?.tempRawVkPosts ??
        []) {
        result[postSummaryCombination.url] = postSummaryCombination;
      }
    },
  });

  return result;
};

export const extractPostSummaryFromFeedSummary = async (
  vkPostUrl: string,
): Promise<TempRawVkPost | undefined> => {
  const categorizedVkUrl = categorizeVkUrl(vkPostUrl);
  if (categorizedVkUrl.vkPageType !== "post") {
    throw new Error(`Expected VK post URL, got ${vkPostUrl}`);
  }

  if (!vkPostSummaryCombinationLookup) {
    vkPostSummaryCombinationLookup = "loading";
    vkPostSummaryCombinationLookup = await loadVkPostSummaryCombinationLookup();
  }

  while (vkPostSummaryCombinationLookup === "loading") {
    await sleep(10);
  }

  return vkPostSummaryCombinationLookup[vkPostUrl];
};
