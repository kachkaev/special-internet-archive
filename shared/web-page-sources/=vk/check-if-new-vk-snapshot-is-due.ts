import * as envalid from "envalid";

import { cleanEnv } from "../../clean-env";
import { calculateDaysSince, serializeTime, unserializeTime } from "../../time";
import { CheckIfNewSnapshotIsDue } from "../types";
import { categorizeVkUrl } from "./categorize-vk-url";
import { getVkWebPageCreationTime } from "./get-vk-web-page-creation-time";

export const checkIfNewVkSnapshotIsDue: CheckIfNewSnapshotIsDue = async ({
  knownSnapshotTimesInAscOrder,
  snapshotGeneratorId,
  webPageDocument,
}) => {
  const categorizedVkUrl = categorizeVkUrl(webPageDocument.webPageUrl);

  const env = cleanEnv({
    VK_ALBUM_SNAPSHOT_FREQUENCY_IN_DAYS: envalid.num({
      default: 30,
    }),
    VK_ACCOUNT_SNAPSHOT_FREQUENCY_IN_DAYS: envalid.num({
      default: 0.8,
    }),
    MIN_WEB_PAGE_AGE_IN_DAYS: envalid.num({
      default: 0,
    }),
  });

  let knownSnapshotTimesToUse = knownSnapshotTimesInAscOrder;
  const minWebPageAgeInDays = env.MIN_WEB_PAGE_AGE_IN_DAYS;
  if (minWebPageAgeInDays > 0) {
    const webPageCreationTime = await getVkWebPageCreationTime(
      webPageDocument.webPageUrl,
    );
    if (webPageCreationTime) {
      const cutOffTime = serializeTime(
        unserializeTime(webPageCreationTime).plus({
          days: minWebPageAgeInDays,
        }),
      );
      if (cutOffTime > serializeTime()) {
        return false;
      }

      knownSnapshotTimesToUse = knownSnapshotTimesInAscOrder.filter(
        (time) => time >= cutOffTime,
      );
    }
  }

  // const oldestSnapshotTime = knownSnapshotTimesInAscOrder.at(0);
  const newestSnapshotTime = knownSnapshotTimesToUse.at(-1);

  // @todo Implement interaction on the post page and enable Playwright snapshots
  // In the meantime, Playwright snapshots do not collect any extra information
  // so we can rely on snapshots made by Wayback Machine.
  if (
    snapshotGeneratorId === "playwright" &&
    (categorizedVkUrl.vkPageType === "post" ||
      categorizedVkUrl.vkPageType === "albumComments" ||
      categorizedVkUrl.vkPageType === "photo" ||
      categorizedVkUrl.vkPageType === "photoRev" ||
      categorizedVkUrl.vkPageType === "uncategorized")
  ) {
    return false;
  }

  // const daysSinceOldestSnapshot = oldestSnapshotTime
  //   ? calculateDaysSince(oldestSnapshotTime)
  //   : Number.MAX_SAFE_INTEGER;
  const daysSinceNewestSnapshot = newestSnapshotTime
    ? calculateDaysSince(newestSnapshotTime)
    : Number.MAX_SAFE_INTEGER;

  switch (categorizedVkUrl.vkPageType) {
    case "account": {
      // @todo Look into posts time stamps in the snapshot summary combination.
      // If there are time gaps, return true for Playwright because previous
      // snapshots could fail half-way.
      return (
        daysSinceNewestSnapshot > env.VK_ACCOUNT_SNAPSHOT_FREQUENCY_IN_DAYS
      );
    }

    case "album":
    case "albumComments": {
      return daysSinceNewestSnapshot > env.VK_ALBUM_SNAPSHOT_FREQUENCY_IN_DAYS;
    }

    case "photo":
    case "photoRev":
    case "post":
    case "uncategorized": {
      return knownSnapshotTimesToUse.length === 0;
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
  }
};
