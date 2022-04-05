import chalk from "chalk";

export class ScriptError extends Error {}

process.on("uncaughtException", (error) => {
  if (error instanceof ScriptError) {
    // eslint-disable-next-line no-console
    console.log(chalk.red(error.message));
  } else {
    // eslint-disable-next-line no-console
    console.log(error);
  }
  process.exit(1);
});
