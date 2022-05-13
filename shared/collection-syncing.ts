import chalk from "chalk";
import * as envalid from "envalid";
import { execa, Options } from "execa";
import fs from "fs-extra";
import { DateTime } from "luxon";
import path from "node:path";
import { WriteStream } from "node:tty";

import { cleanEnv } from "./clean-env";
import { getCollectionDirPath } from "./collection";
import { EarlyExitError, UserFriendlyError } from "./errors";

type SyncMode = "auto" | "forced" | "intermediate";

let lastSyncDateTime: DateTime | undefined;

export const syncCollectionIfNeeded = async ({
  output,
  message = "Update collection",
  mode = "auto",
}: {
  output: WriteStream;
  message?: string;
  mode?: SyncMode;
}) => {
  const env = cleanEnv({
    AUTO_SYNC_COLLECTION: envalid.bool({
      default: true,
    }),
    AUTO_SYNC_COLLECTION_INTERVAL_IN_MINUTES: envalid.num({
      default: 5,
    }),
  });

  const now = DateTime.now();

  const autoSync = env.AUTO_SYNC_COLLECTION;
  const autoSyncInterval =
    env.AUTO_SYNC_COLLECTION_INTERVAL_IN_MINUTES * 60 * 1000;

  if (mode === "intermediate") {
    if (!lastSyncDateTime) {
      lastSyncDateTime = now;

      return;
    }

    if (lastSyncDateTime.diff(now).as("milliseconds") < autoSyncInterval) {
      return;
    }
  }

  if (mode !== "forced" && !autoSync) {
    return;
  }

  lastSyncDateTime = now;

  const collectionDirPath = getCollectionDirPath();

  const collectionIsGitRepo = await fs.pathExists(
    path.resolve(collectionDirPath, ".git"),
  );

  if (!collectionIsGitRepo) {
    if (mode === "forced") {
      throw new UserFriendlyError(
        `Collection ${collectionDirPath} is not a git repository.`,
      );
    } else {
      if (mode === "auto") {
        output.write(
          chalk.yellow(
            `Collection syncing is skipped because ${collectionDirPath} is not a git repository. Your data is at risk because it is not backed up\n`,
          ),
        );
      }

      return;
    }
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
    if (mode !== "intermediate") {
      output.write(
        chalk.gray(
          `Collection ${collectionDirPath} contains no changes to commit\n`,
        ),
      );
    }

    return;
  } else {
    await execa("git", ["add", "--all"], execaOptions);

    await execa("git", ["commit", "--message", message], execaOptions);
  }

  const { exitCode } = await execa("git", ["push"], {
    ...execaOptions,
    reject: false,
  });

  if (exitCode && mode === "forced") {
    throw new EarlyExitError(exitCode);
  }
};
