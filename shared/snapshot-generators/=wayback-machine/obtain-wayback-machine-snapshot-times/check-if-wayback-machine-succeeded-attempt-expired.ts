import { unserializeTime } from "../../../time";
import { CheckIfSucceededSnapshotAttemptExpired } from "../../types";

export const checkIfWaybackMachineSucceededSnapshotAttemptExpired: CheckIfSucceededSnapshotAttemptExpired =
  (attempt) => {
    const snapshotAgeInSeconds = -unserializeTime(attempt.startedAt)
      .diffNow()
      .as("seconds");

    return attempt.message?.match(/isodos/i)
      ? snapshotAgeInSeconds > 60 * 60 * 24 * 1.5 // web.archive.org indexes are updated after a while when using Isodos
      : snapshotAgeInSeconds > 60 * 10; // 10 mins is typically enough when using web.archive.org/save
  };
