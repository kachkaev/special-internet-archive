import { CalculateRelevantTimeMinForNewIncrementalSnapshot } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";

export const calculateRelevantTimeMinForNewIncrementalVkSnapshot: CalculateRelevantTimeMinForNewIncrementalSnapshot =
  ({ webPageDocument, mostRecentSnapshotTime, snapshotGeneratorId }) => {
    const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);

    if (
      snapshotGeneratorId === "playwright" &&
      categorizedVkUrl.vkPageType === "account"
    ) {
      // There is no point scrolling through the whole wall again if a recent
      // snapshot contains all posts anyway

      // @todo Look at the distribution of wall posts rather than just at
      // mostRecentSnapshotTime. It is possible that previous snapshots were incomplete

      return mostRecentSnapshotTime;
    }
  };
