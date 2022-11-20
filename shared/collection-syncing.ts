import path from "node:path";
import { WriteStream } from "node:tty";

import chalk from "chalk";
import * as envalid from "envalid";
import { execa, Options } from "execa";
import fs from "fs-extra";
import { DateTime } from "luxon";

import { cleanEnv } from "./clean-env";
import { getCollectionDirPath } from "./collection";
import { UserFriendlyError } from "./errors";
import { OperationResult } from "./operations";

const checkIfCollectionHasUncommittedChanges = async (): Promise<boolean> => {
  const collectionDirPath = getCollectionDirPath();
  try {
    const { stdout } = await execa("git", ["status", "--short"], {
      cwd: collectionDirPath,
      stdio: "pipe",
      timeout: 60_000, // 1 minute
    });

    return Boolean(stdout);
  } catch {
    return false;
  }
};

type SyncMode = "auto" | "forced" | "intermediate" | "preliminary";

let lastSyncDateTime: DateTime | undefined;

export const syncCollectionIfNeeded = async ({
  output,
  message = "Update collection",
  mode = "auto",
}: {
  output: WriteStream;
  message?: string | undefined;
  mode?: SyncMode;
}): Promise<OperationResult> => {
  const env = cleanEnv({
    AUTO_SYNC_COLLECTION: envalid.bool({
      default: true,
    }),
    AUTO_SYNC_COLLECTION_INTERVAL_IN_MINUTES: envalid.num({
      default: 10,
    }),
  });

  const now = DateTime.now();

  const autoSync = env.AUTO_SYNC_COLLECTION;
  const autoSyncInterval =
    env.AUTO_SYNC_COLLECTION_INTERVAL_IN_MINUTES * 60 * 1000;

  if (mode === "intermediate") {
    if (!lastSyncDateTime) {
      lastSyncDateTime = now;

      return { status: "skipped" };
    }

    if (now.diff(lastSyncDateTime).as("milliseconds") < autoSyncInterval) {
      return { status: "skipped" };
    }

    output.write("\n");
  }

  if (mode !== "forced" && !autoSync) {
    return { status: "skipped" };
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

      return { status: "skipped" };
    }
  }

  const execaOptions: Options = {
    cwd: collectionDirPath,
    stdio: "inherit",
    timeout: 3_600_000, // 1 hour
  };

  if (!(await checkIfCollectionHasUncommittedChanges())) {
    if (mode !== "intermediate" && mode !== "preliminary") {
      output.write(
        chalk.gray(
          `Collection ${collectionDirPath} contains no changes to commit\n`,
        ),
      );
    }

    return { status: "skipped" };
  } else {
    await execa("git", ["add", "--all"], execaOptions);

    await execa("git", ["commit", "--message", message], execaOptions);
  }

  const { exitCode } = await execa("git", ["push"], {
    ...execaOptions,
    reject: false,
  });

  if (exitCode) {
    return { status: "failed" };
  }

  return { status: "processed" };
};
