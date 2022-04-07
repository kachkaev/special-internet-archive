import chalk from "chalk";

export class UserFriendlyError extends Error {}

if (typeof process !== "undefined") {
  process.on("uncaughtException", (error) => {
    if (error instanceof UserFriendlyError) {
      // eslint-disable-next-line no-console
      console.log(chalk.red(error.message));
    } else {
      // eslint-disable-next-line no-console
      console.log(error);
    }
    process.exit(1);
  });
}
