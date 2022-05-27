import * as envalid from "envalid";

import { cleanEnv } from "../../clean-env";
import { calculateDaysSince } from "../../time";
import { CheckIfSnapshotIsDue } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";

export const checkIfNewVkSnapshotIsDue: CheckIfSnapshotIsDue = ({
  knownSnapshotTimesInAscOrder,
  snapshotGeneratorId,
  webPageDocument,
}) => {
  const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);

  const env = cleanEnv({
    VK_ACCOUNT_SNAPSHOT_FREQUENCY_IN_DAYS: envalid.num({
      default: 3,
    }),
  });

  const oldestSnapshotTime = knownSnapshotTimesInAscOrder.at(0);
  const newestSnapshotTime = knownSnapshotTimesInAscOrder.at(-1);

  // @todo Implement interaction on the post page and enable Playwright snapshots
  // In the meantime, Playwright snapshots do not collect any extra information
  // so we can rely on snapshots made by Wayback Machine.
  if (
    snapshotGeneratorId === "playwright" &&
    categorizedVkUrl.vkPageType === "post"
  ) {
    return false;
  }

  if (!oldestSnapshotTime || !newestSnapshotTime) {
    return true;
  }

  const daysSinceNewestSnapshot = calculateDaysSince(newestSnapshotTime);
  // const daysSinceOldestSnapshot = calculateDaysSince(oldestSnapshotTime);

  switch (categorizedVkUrl.vkPageType) {
    case "post": {
      return knownSnapshotTimesInAscOrder.length === 0;
      // if (daysSinceOldestSnapshot <= 5) {
      //   return daysSinceNewestSnapshot > 2;
      // } else if (daysSinceOldestSnapshot <= 14) {
      //   return daysSinceNewestSnapshot > 7;
      // } else if (daysSinceOldestSnapshot <= 30) {
      //   return daysSinceNewestSnapshot > 14;
      // } else if (daysSinceOldestSnapshot <= 90) {
      //   return daysSinceNewestSnapshot > 30;
      // } else {
      //   return daysSinceNewestSnapshot > 90;
      // }
    }
    case "account":
      // @todo Look into posts time stamps in the snapshot summary combination.
      // If there are time gaps, return true for Playwright because previous
      // snapshots could fail half-way.
      return (
        daysSinceNewestSnapshot > env.VK_ACCOUNT_SNAPSHOT_FREQUENCY_IN_DAYS
      );
  }
};
