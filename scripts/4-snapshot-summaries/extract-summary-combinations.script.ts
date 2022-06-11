import chalk from "chalk";
import _ from "lodash";
import path from "node:path";

import { throwExitCodeErrorIfOperationFailed } from "../../shared/errors";
import { listFilePaths } from "../../shared/list-file-paths";
import {
  readSnapshotSummaryCombinationDocument,
  readSnapshotSummaryDocument,
  SnapshotSummaryCombinationData,
  snapshotSummaryCombinationStaleTime,
  SnapshotSummaryDocument,
  writeSnapshotSummaryCombinationDocument,
} from "../../shared/snapshot-summaries";
import { serializeTime } from "../../shared/time";
import { processWebPages } from "../../shared/web-page-documents";
import { extractSnapshotSummaryCombinationData } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Extracting snapshot summary combinations\n"));

  let pagesWithoutSnapshotSummariesFound = false;

  const operationResult = await processWebPages({
    output,
    processWebPage: async ({ webPageDirPath, webPageDocument }) => {
      const snapshotSummaryFilePaths = await listFilePaths({
        fileSearchDirPath: path.resolve(webPageDirPath, "snapshots"),
        fileSearchPattern: "*.summary.json",
      });

      if (snapshotSummaryFilePaths.length === 0) {
        output.write(chalk.yellow(`snapshot summaries not found`));
        pagesWithoutSnapshotSummariesFound = true;

        return;
      }

      const snapshotSummaryDocuments: SnapshotSummaryDocument[] = [];
      for (const snapshotSummaryFilePath of snapshotSummaryFilePaths) {
        snapshotSummaryDocuments.push(
          await readSnapshotSummaryDocument(snapshotSummaryFilePath),
        );
      }

      const snapshotSummaryCombinationDocument =
        await readSnapshotSummaryCombinationDocument(webPageDirPath);

      if (snapshotSummaryCombinationDocument) {
        const newestSnapshotExtractedAt = _.max(
          snapshotSummaryDocuments.map(
            (snapshotSummaryDocument) => snapshotSummaryDocument.extractedAt,
          ),
        );
        if (
          newestSnapshotExtractedAt &&
          newestSnapshotExtractedAt <
            snapshotSummaryCombinationDocument.combinedAt &&
          snapshotSummaryCombinationDocument.combinedAt >
            snapshotSummaryCombinationStaleTime
        ) {
          output.write(
            chalk.gray("snapshot summary combination is up to date"),
          );

          return;
        }
      }

      output.write(
        `snapshot summary combination is being ${
          snapshotSummaryCombinationDocument ? "updated" : "created"
        } from ${snapshotSummaryFilePaths.length} snapshot${
          snapshotSummaryFilePaths.length !== 1 ? "s" : ""
        }... `,
      );

      const snapshotSummaryCombinationData: SnapshotSummaryCombinationData =
        extractSnapshotSummaryCombinationData({
          snapshotSummaryDocuments,
        });

      await writeSnapshotSummaryCombinationDocument(webPageDirPath, {
        documentType: "snapshotSummaryCombination",
        webPageUrl: webPageDocument.webPageUrl,
        combinedAt: serializeTime(),
        ...snapshotSummaryCombinationData,
      });

      output.write(chalk.magenta("done"));
    },
  });

  if (pagesWithoutSnapshotSummariesFound as boolean) {
    output.write(
      chalk.yellow(
        "To avoid missing snapshot summaries, make sure you generate snapshots and extract their summaries before running this script.\n",
      ),
    );
  }

  throwExitCodeErrorIfOperationFailed(operationResult);
};

await script();
