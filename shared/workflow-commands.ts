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
}): void => {
  if (!process.env["GITHUB_ACTIONS"]) {
    return;
  }

  output.write(`::${messageType}::${message}\n`);
};
