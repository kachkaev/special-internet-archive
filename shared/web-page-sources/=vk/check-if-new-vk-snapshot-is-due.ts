import { calculateDaysSince } from "../../time";
import { CheckIfSnapshotIsDue } from "../types";
import { assertVkUrl } from "./assert-vk-url";
import { categorizeVkUrl } from "./categorize-vk-url";

export const checkIfNewVkSnapshotIsDue: CheckIfSnapshotIsDue = ({
  webPageDocument,
  knownSnapshotTimesInAscOrder,
}) => {
  assertVkUrl(webPageDocument.webPageUrl);

  const oldestSnapshotTime = knownSnapshotTimesInAscOrder.at(0);
  const newestSnapshotTime = knownSnapshotTimesInAscOrder.at(-1);
  if (!oldestSnapshotTime || !newestSnapshotTime) {
    return true;
  }

  const daysSinceNewestSnapshot = calculateDaysSince(newestSnapshotTime);
  const daysSinceOldestSnapshot = calculateDaysSince(oldestSnapshotTime);

  const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);
  switch (categorizedVkUrl.vkPageType) {
    case "account":
      return daysSinceNewestSnapshot > 1;
    case "post": {
      if (daysSinceOldestSnapshot <= 5) {
        return daysSinceNewestSnapshot > 2;
      } else if (daysSinceOldestSnapshot <= 14) {
        return daysSinceNewestSnapshot > 7;
      } else if (daysSinceOldestSnapshot <= 30) {
        return daysSinceNewestSnapshot > 14;
      } else if (daysSinceOldestSnapshot <= 90) {
        return daysSinceNewestSnapshot > 30;
      } else {
        return daysSinceNewestSnapshot > 90;
      }
    }
  }
};
