import chalk from "chalk";
import { WriteStream } from "node:tty";

import { OperationResult } from "../../shared/operations";

export const outputRegisterWebPageOperationResult = ({
  output,
  operationResult,
}: {
  output: WriteStream;
  operationResult: OperationResult;
}) => {
  switch (operationResult.status) {
    case "failed": {
      output.write(chalk.red(operationResult.message ?? "unknown error"));
      break;
    }
    case "processed": {
      output.write(chalk.magenta("registered"));
      break;
    }

    case "skipped": {
      output.write(chalk.gray("already registered"));
      break;
    }
  }
};
