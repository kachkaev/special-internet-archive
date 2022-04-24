import chalk from "chalk";
import { execa, Options } from "execa";
import fs from "fs-extra";
import path from "node:path";

import { getCollectionDirPath } from "../../shared/collection";
import { UserFriendlyError } from "../../shared/errors";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold("Committing and pushing changes in archive collection\n"),
  );

  const collectionDirPath = getCollectionDirPath();

  if (!(await fs.pathExists(path.resolve(collectionDirPath, ".git")))) {
    throw new UserFriendlyError(
      `Collection ${collectionDirPath} is not a git repository.`,
    );
  }

  const execaOptions: Options = {
    cwd: collectionDirPath,
    stdio: "inherit",
  };

  const { stdout } = await execa("git", ["status", "--short"], {
    ...execaOptions,
    stdio: "pipe",
  });

  if (!stdout) {
    output.write(
      chalk.gray(
        `Collection ${collectionDirPath} contains no changes to commit\n`,
      ),
    );
  } else {
    await execa("git", ["add", "--all"], execaOptions);

    await execa(
      "git",
      ["commit", "--message", "Update collection"],
      execaOptions,
    );
  }

  await execa("git", ["push"], execaOptions);
};

await script();
