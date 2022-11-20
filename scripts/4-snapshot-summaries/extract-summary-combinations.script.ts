import path from "node:path";

import chalk from "chalk";
import _ from "lodash";

import { throwExitCodeErrorIfOperationFailed } from "../../shared/errors";
import { reportGithubMessageIfNeeded } from "../../shared/github";
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
import { skipWebPageBasedOnEnv } from "../../shared/web-page-documents/skip-web-page-based-on-env";
import { extractSnapshotSummaryCombinationData } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Extracting snapshot summary combinations\n"));

  let pagesWithoutSnapshotSummariesFound = false;

  const operationResult = await processWebPages({
    output,
    processWebPage: async ({ webPageDirPath, webPageDocument }) => {
      const earlyResult = await skipWebPageBasedOnEnv({
        webPageDirPath,
        webPageDocument,
      });

      if (earlyResult) {
        return earlyResult;
      }

      const snapshotSummaryFilePaths = await listFilePaths({
        fileSearchDirPath: path.resolve(webPageDirPath, "snapshots"),
        fileSearchPattern: "*.summary.json",
      });

      if (snapshotSummaryFilePaths.length === 0) {
        pagesWithoutSnapshotSummariesFound = true;

        return {
          status: "skipped",
          message: "snapshot summaries not found",
        };
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
          return {
            status: "skipped",
            message: "snapshot summary combination is up to date",
          };
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

      if (snapshotSummaryCombinationData.tempPageNotFound) {
        const lastTempRawVkPost =
          snapshotSummaryCombinationData.tempRawVkPosts?.at(-1);

        reportGithubMessageIfNeeded({
          message: `${
            webPageDocument.webPageUrl
          } is reported as not found. Page was moved?${
            lastTempRawVkPost
              ? ` Most recent post URL: ${lastTempRawVkPost.url}`
              : ""
          }`,
          messageType: "warning",
          output,
        });
      }

      return {
        status: "processed",
        message: "done",
      };
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
