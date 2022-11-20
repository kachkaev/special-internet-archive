import path from "node:path";

import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import _ from "lodash";

import { cleanEnv } from "../../../shared/clean-env";
import { syncCollectionIfNeeded } from "../../../shared/collection-syncing";
import { UserFriendlyError } from "../../../shared/errors";
import {
  generateWebPageDirPathLookup,
  readWebPageDocument,
  registerWebPage,
} from "../../../shared/web-page-documents";
import { generateWebPageDirPath } from "../../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Moving web page\n"));

  await syncCollectionIfNeeded({
    output,
    mode: "preliminary",
  });

  const env = cleanEnv({
    OLD_URL: envalid.url({ desc: "URL to move from" }),
    NEW_URL: envalid.url({ desc: "URL to move to" }),
  });

  const oldUrl = env.OLD_URL;
  const newUrl = env.NEW_URL;

  output.write(
    `Old URL: ${chalk.underline(oldUrl)}\nNew URL: ${chalk.underline(
      newUrl,
    )}\n`,
  );

  if (oldUrl === newUrl) {
    throw new UserFriendlyError(`URLs cannot be equal`);
  }

  const webPageDirPathLookup = await generateWebPageDirPathLookup();
  const oldWebPageDirPath = webPageDirPathLookup[oldUrl];
  const newWebPageDirPath = generateWebPageDirPath(newUrl);

  if (!oldWebPageDirPath) {
    throw new UserFriendlyError(`Unable to find ${oldUrl} in the collection`);
  }

  if (webPageDirPathLookup[newUrl]) {
    throw new UserFriendlyError(`URL ${newUrl} is already registered`);
  }

  output.write("Registering new web page... ");

  const oldWebPageDocument = await readWebPageDocument(oldWebPageDirPath);
  const oldUrls = _.sortBy(
    _.uniq([...(oldWebPageDocument.annotation.oldUrls ?? []), oldUrl]).filter(
      (url) => url !== newUrl,
    ),
  );

  await registerWebPage(newUrl, "script:move-page", webPageDirPathLookup, {
    oldUrls,
  });

  output.write(chalk.magenta("done\n"));
  output.write("Moving snapshots... ");

  const oldSnapshotDirPath = path.resolve(oldWebPageDirPath, "snapshots");
  const newSnapshotDirPath = path.resolve(newWebPageDirPath, "snapshots");

  if (await fs.pathExists(oldSnapshotDirPath)) {
    await fs.move(oldSnapshotDirPath, newSnapshotDirPath);
    output.write(chalk.magenta("done\n"));
  } else {
    output.write(chalk.gray("no snapshots found\n"));
  }

  output.write("Deleting old web page directory... ");
  await fs.remove(oldWebPageDirPath);
  output.write(chalk.magenta("done\n"));

  await syncCollectionIfNeeded({
    output,
    message: `Move ${oldUrl} to ${newUrl}`,
  });
};

await script();
