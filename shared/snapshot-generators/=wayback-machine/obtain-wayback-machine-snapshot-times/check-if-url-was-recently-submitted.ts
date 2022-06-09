import sleep from "sleep-promise";

import { readSnapshotQueueDocument } from "../../../snapshot-queues";
import { calculateDaysSince } from "../../../time";

let lookup: Record<string, boolean> | "loading" | undefined;

export const checkIfUrlWasRecentlySubmitted = async (
  webPageUrl: string,
): Promise<boolean> => {
  if (!lookup) {
    lookup = "loading";

    const snapshotQueueDocument = await readSnapshotQueueDocument(
      "waybackMachine",
    );

    lookup = {};
    for (const item of snapshotQueueDocument.items) {
      const succeededAttemptStartedAt = item.attempts?.find(
        (attempt) => attempt.status === "succeeded",
      )?.startedAt;

      if (
        succeededAttemptStartedAt &&
        calculateDaysSince(succeededAttemptStartedAt) < 3
      ) {
        lookup[item.webPageUrl] = true;
      }
    }
  }

  while (lookup === "loading") {
    await sleep(10);
  }

  return lookup[webPageUrl] ?? false;
};
