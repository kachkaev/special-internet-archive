import chalk from "chalk";

import { OperationResult, OperationStatus } from "./operations";

export class UserFriendlyError extends Error {}

export class AbortError extends Error {
  constructor() {
    super();
  }
}

export class ExitCodeError extends Error {
  readonly exitCode: number;
  constructor(exitCode = 1) {
    super();
    this.exitCode = exitCode;
  }
}

if (typeof process !== "undefined") {
  process.on("uncaughtException", (error) => {
    if (error instanceof ExitCodeError) {
      process.exit(error.exitCode);
    }

    if (error instanceof AbortError || error instanceof UserFriendlyError) {
      if (error.message) {
        // eslint-disable-next-line no-console
        console.log(chalk.red(error.message));
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(error);
    }
    process.exit(1);
  });
}

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return `${error as string}`;
};

export const throwExitCodeErrorIfOperationFailed = (
  operationResultOrStatus: OperationResult | OperationStatus,
): void => {
  if (
    (typeof operationResultOrStatus === "object" &&
      operationResultOrStatus.status === "failed") ||
    operationResultOrStatus === "failed"
  ) {
    throw new ExitCodeError(1);
  }
};
