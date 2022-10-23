// https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions

import { WriteStream } from "node:tty";

export const reportGithubMessageIfNeeded = ({
  messageType,
  output,
  message,
}: {
  messageType: "warning" | "error" | "notice";
  output: WriteStream;
  message: string;
}): boolean => {
  if (!process.env["GITHUB_ACTIONS"]) {
    return false;
  }

  output.write(`\n::${messageType}::${message}\n`);

  return true;
};
