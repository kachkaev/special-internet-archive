import chalk from "chalk";
import * as envalid from "envalid";
import RegexParser from "regex-parser";

import { cleanEnv } from "../../shared/clean-env";
import { readUrlInboxRows } from "../../shared/collection";
import { runScriptSequence } from "../../shared/script-sequencing";
import { generateWebPageDirPathLookup } from "../../shared/web-page-documents";
import { checkIfWebPageUrlIsAcceptable } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold(`Evolving collection\n`));

  const env = cleanEnv({
    FILTER_SNAPSHOT_GENERATOR: envalid.str({
      desc: "Regex to use when filtering snapshot generators",
      default: ".*",
    }),
    COLLECTION_EVOLVEMENT_MODE: envalid.str({
      choices: ["repeatedly", "once"],
      default: "repeatedly",
    }),
  });

  const filterSnapshotGeneratorRegex = RegexParser(
    env.FILTER_SNAPSHOT_GENERATOR,
  );

  const evolveCollectionRepeatedly =
    env.COLLECTION_EVOLVEMENT_MODE === "repeatedly";

  for (;;) {
    await runScriptSequence({
      // prettier-ignore
      items: [
      { scriptFilePath: "scripts/2-registration/1-ensure-url-inbox-exists.script.ts" },
      { scriptFilePath: "scripts/2-registration/2-register-from-url-inbox.script.ts" },
      { scriptFilePath: "scripts/2-registration/3-clean-up-url-inbox.script.ts" },

      ...(filterSnapshotGeneratorRegex.test("playwright") ? [
        { scriptFilePath: "scripts/3-snapshots/playwright/1-update-inventory.script.ts" },
        { scriptFilePath: "scripts/3-snapshots/playwright/2-compose-queue.script.ts" },
        { scriptFilePath: "scripts/3-snapshots/playwright/3-process-queue.script.ts" },
        { scriptFilePath: "scripts/4-snapshot-summaries/playwright/1-update-inventory.script.ts" },
        { scriptFilePath: "scripts/4-snapshot-summaries/playwright/2-extract-summaries.script.ts" },
        { scriptFilePath: "scripts/4-snapshot-summaries/extract-summary-combinations.script.ts" },
        { scriptFilePath: "scripts/5-annotations/extract-from-snapshot-summary-combinations.script.ts" },

        { scriptFilePath: "scripts/6-results/commit-and-push-changes.script.ts" },
        { scriptFilePath: "scripts/6-results/auto-populate-url-inbox.script.ts" },

        { scriptFilePath: "scripts/2-registration/1-ensure-url-inbox-exists.script.ts" },
        { scriptFilePath: "scripts/2-registration/2-register-from-url-inbox.script.ts" },
        { scriptFilePath: "scripts/2-registration/3-clean-up-url-inbox.script.ts" },
      ] : []),

      ...(filterSnapshotGeneratorRegex.test("waybackMachine") ? [
        { scriptFilePath: "scripts/3-snapshots/wayback-machine/1-update-inventory.script.ts" },
        { scriptFilePath: "scripts/3-snapshots/wayback-machine/2-compose-queue.script.ts" },
        { scriptFilePath: "scripts/3-snapshots/wayback-machine/3-process-queue.script.ts" },
      ] : []),

      { scriptFilePath: "scripts/6-results/commit-and-push-changes.script.ts" },
    ],
      output,
    });

    if (!evolveCollectionRepeatedly) {
      break;
    }

    const webPageDirPathLookup = await generateWebPageDirPathLookup();
    const urlInboxRows = (await readUrlInboxRows()) ?? [];

    const urlInboxContainsUnregisteredAcceptableUrls = urlInboxRows.some(
      (urlInboxRow) =>
        urlInboxRow.type === "url" &&
        !webPageDirPathLookup[urlInboxRow.url] &&
        checkIfWebPageUrlIsAcceptable(urlInboxRow.url),
    );

    if (!urlInboxContainsUnregisteredAcceptableUrls) {
      break;
    }

    output.write(
      chalk.bold(
        chalk.blue(
          chalk.inverse(
            `\nURL inbox contains unregistered acceptable URLs, so repeating the cycle...\n\n`,
          ),
        ),
      ),
    );
  }
};

await script();
