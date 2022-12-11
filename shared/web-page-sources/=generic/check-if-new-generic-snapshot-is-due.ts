import { CheckIfSnapshotIsDue } from "../types";

export const checkIfNewGenericSnapshotIsDue: CheckIfSnapshotIsDue = ({
  knownSnapshotTimesInAscOrder,
  snapshotGeneratorId,
}) => {
  if (snapshotGeneratorId === "playwright") {
    return false;
  }

  return knownSnapshotTimesInAscOrder.length === 0;
};
