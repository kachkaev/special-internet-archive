import chalk from "chalk";

import { runScriptSequence } from "../../shared/script-sequencing";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold(`Running the whole cycle\n`));

  await runScriptSequence({
    // prettier-ignore
    items: [
      { scriptFilePath: "scripts/2-registration/1-ensure-url-inbox-exists.script.ts" },
      { scriptFilePath: "scripts/2-registration/2-register-from-url-inbox.script.ts" },
      { scriptFilePath: "scripts/2-registration/3-clean-up-url-inbox.script.ts" },

      { scriptFilePath: "scripts/3-snapshots/wayback-machine/1-update-inventory.script.ts" },
      { scriptFilePath: "scripts/3-snapshots/wayback-machine/2-compose-queue.script.ts" },
      { scriptFilePath: "scripts/3-snapshots/wayback-machine/3-process-queue.script.ts" },

      { scriptFilePath: "scripts/3-snapshots/playwright/1-update-inventory.script.ts" },
      { scriptFilePath: "scripts/3-snapshots/playwright/2-compose-queue.script.ts" },
      { scriptFilePath: "scripts/3-snapshots/playwright/3-process-queue.script.ts" },

      // @todo Add after implementing
      // { scriptFilePath: "scripts/4-snapshot-summaries/wayback-machine/1-update-inventory.script.ts" },
      // { scriptFilePath: "scripts/4-snapshot-summaries/wayback-machine/2-extract-summaries.script.ts" },

      { scriptFilePath: "scripts/4-snapshot-summaries/playwright/1-update-inventory.script.ts" },
      { scriptFilePath: "scripts/4-snapshot-summaries/playwright/2-extract-summaries.script.ts" },

      { scriptFilePath: "scripts/4-snapshot-summaries/extract-summary-combinations.script.ts" },

      { scriptFilePath: "scripts/5-annotations/extract-from-snapshot-summary-combinations.script.ts" },

      { scriptFilePath: "scripts/6-results/auto-populate-url-inbox.script.ts" },
    ],
    output,
  });
};

await script();
