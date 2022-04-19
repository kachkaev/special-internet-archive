import chalk from "chalk";
import fs from "fs-extra";
import { WriteStream } from "node:tty";

import { getErrorMessage, UserFriendlyError } from "../../shared/errors";
import { SnapshotGeneratorId } from "../../shared/snapshot-generator-id";
import { getSnapshotGenerator } from "../../shared/snapshot-generators";
import {
  checkIfSnapshotSummaryDocumentExists,
  readSnapshotSummaryDocument,
  SnapshotSummaryDocument,
  snapshotSummaryStaleTime,
  writeSnapshotSummaryDocument,
} from "../../shared/snapshot-summaries";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";

export const generateExtractSnapshotSummariesScript =
  ({
    output,
    snapshotGeneratorId,
  }: {
    output: WriteStream;
    snapshotGeneratorId: SnapshotGeneratorId;
  }) =>
  async () => {
    const {
      downloadSnapshot,
      extractSnapshotSummaryData,
      generateSnapshotFilePath,
      name: snapshotGeneratorName,
      role: snapshotGeneratorRole,
      finishExtractSnapshotSummaryDataBatch,
    } = getSnapshotGenerator(snapshotGeneratorId);

    output.write(
      chalk.bold(`Extracting ${snapshotGeneratorName} snapshot summaries\n`),
    );

    if (!generateSnapshotFilePath || !extractSnapshotSummaryData) {
      throw new UserFriendlyError(
        `Summary extraction for ${snapshotGeneratorName} snapshots is not implemented yet`,
      );
    }

    let pagesWithoutSnapshotsFound = false;

    await processWebPages({
      output,
      processWebPage: async ({ webPageDirPath, webPageDocument }) => {
        const snapshotInventoryItems =
          webPageDocument.snapshotInventoryLookup[snapshotGeneratorId]?.items ??
          [];

        if (snapshotInventoryItems.length === 0) {
          output.write(chalk.yellow(`no snapshots found`));
          pagesWithoutSnapshotsFound = true;

          return;
        }

        output.write(`snapshot count: ${snapshotInventoryItems.length}`);

        for (const snapshotInventoryItem of snapshotInventoryItems) {
          const snapshotFilePath = generateSnapshotFilePath({
            webPageDirPath,
            ...snapshotInventoryItem,
          });

          output.write(`\n  ${chalk.green(snapshotInventoryItem.capturedAt)} `);
          if (snapshotInventoryItem.aliasUrl) {
            output.write(
              chalk.green(`alias ${snapshotInventoryItem.aliasUrl} `),
            );
          }

          let existingSnapshotSummary: SnapshotSummaryDocument | undefined;

          try {
            existingSnapshotSummary = await readSnapshotSummaryDocument(
              snapshotFilePath,
            );
          } catch {
            // noop: summary does not exist
          }

          if (
            existingSnapshotSummary?.extractedAt &&
            existingSnapshotSummary.extractedAt > snapshotSummaryStaleTime
          ) {
            output.write(chalk.gray("snapshot summary is up to date"));
            continue;
          }

          try {
            if (!(await fs.pathExists(snapshotFilePath))) {
              if (snapshotGeneratorRole === "internal") {
                throw new Error(
                  `Snapshot file is unexpectedly missing. Please update snapshot inventory.`,
                );
              } else {
                if (!downloadSnapshot) {
                  throw new Error(
                    `Unable to download ${snapshotGeneratorName} snapshot because this is not implemented yet`,
                  );
                }

                await downloadSnapshot({
                  webPageDirPath,
                  webPageDocument,
                  ...snapshotInventoryItem,
                });
              }
            }

            if (await checkIfSnapshotSummaryDocumentExists(snapshotFilePath)) {
              output.write("snapshot summary is being updated... ");
            } else {
              output.write("snapshot summary is being created... ");
            }

            const snapshotSummaryData = await extractSnapshotSummaryData({
              snapshotFilePath,
            });

            await writeSnapshotSummaryDocument(snapshotFilePath, {
              documentType: "snapshotSummary",
              webPageUrl: webPageDocument.webPageUrl,
              ...snapshotInventoryItem,
              extractedAt: serializeTime(),
              ...snapshotSummaryData,
            });

            output.write(chalk.magenta("done"));
          } catch (error) {
            output.write(chalk.red(getErrorMessage(error)));
          }
        }
      },
    });

    await finishExtractSnapshotSummaryDataBatch?.();

    if (pagesWithoutSnapshotsFound as boolean) {
      output.write(
        chalk.yellow(
          "To avoid missing snapshots, make sure you generate snapshots before running this script.\n",
        ),
      );
    }
  };
