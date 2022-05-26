// https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions

import { WriteStream } from "node:tty";

export const reportGithubMessageIfNeeded = ({
  messageType,
  output,
  message,
}: {
  messageType: "warning" | "error";
  output: WriteStream;
  message: string;
}): boolean => {
  if (!process.env["GITHUB_ACTIONS"]) {
    return false;
  }

  output.write(`::${messageType}::${message}\n`);

  return true;
};
