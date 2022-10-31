import _ from "lodash";

import { readSnapshotSummaryCombinationDocument } from "../../snapshot-summaries";
import { CalculateRelevantTimeMinForNewIncrementalSnapshot } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";

export const calculateRelevantTimeMinForNewIncrementalVkSnapshot: CalculateRelevantTimeMinForNewIncrementalSnapshot =
  async ({
    mostRecentSnapshotTime,
    snapshotGeneratorId,
    webPageDirPath,
    webPageDocument,
  }) => {
    const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);

    if (
      snapshotGeneratorId === "playwright" &&
      categorizedVkUrl.vkPageType === "account"
    ) {
      // There is no point scrolling through the whole wall again if a recent
      // snapshot contains all posts anyway

      const snapshotSummaryCombinationDocument =
        await readSnapshotSummaryCombinationDocument(webPageDirPath);

      if (snapshotSummaryCombinationDocument) {
        const mostRecentWallPostTime = _.max(
          snapshotSummaryCombinationDocument.tempRawVkPosts?.map(
            (post) => post.date,
          ) ?? [],
        );
        if (mostRecentWallPostTime) {
          return mostRecentWallPostTime;
        }
      }

      return mostRecentSnapshotTime;
    }
  };
