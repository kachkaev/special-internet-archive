import { UserFriendlyError } from "./errors";

export type SuccessfulOperationStatus = "processed" | "skipped";
export type OperationStatus = SuccessfulOperationStatus | "failed";

export interface SuccessfulOperationResult {
  status: SuccessfulOperationStatus;
  message?: string;
}

export interface OperationResult {
  status: OperationStatus;
  message?: string;
}

interface ThrowOnOperationFailure {
  (
    operationStatus: OperationResult,
  ): asserts operationStatus is SuccessfulOperationResult;
}

export const throwOnOperationFailure: ThrowOnOperationFailure = (
  operationStatus,
) => {
  if (operationStatus.status === "failed") {
    throw new UserFriendlyError(operationStatus.message ?? "operation failed");
  }
};
