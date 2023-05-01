import { CheckIfNewSnapshotIsDue } from "../types";

export const checkIfNewGenericSnapshotIsDue: CheckIfNewSnapshotIsDue = ({
  knownSnapshotTimesInAscOrder,
  snapshotGeneratorId,
}) => {
  if (snapshotGeneratorId === "playwright") {
    return false;
  }

  return knownSnapshotTimesInAscOrder.length === 0;
};
