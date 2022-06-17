import sleep from "sleep-promise";

import {
  readSnapshotQueueDocument,
  SnapshotAttempt,
} from "../../../snapshot-queues";
import { checkIfWaybackMachineSucceededSnapshotAttemptExpired } from "./check-if-wayback-machine-succeeded-attempt-expired";

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
      const succeededAttempt = item.attempts?.find(
        (attempt): attempt is SnapshotAttempt<"succeeded"> =>
          attempt.status === "succeeded",
      );

      if (!succeededAttempt) {
        continue;
      }

      if (
        !checkIfWaybackMachineSucceededSnapshotAttemptExpired(succeededAttempt)
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
