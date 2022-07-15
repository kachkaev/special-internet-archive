import chalk from "chalk";
import _ from "lodash";

import { syncCollectionIfNeeded } from "../../shared/collection-syncing";
import { throwExitCodeErrorIfOperationFailed } from "../../shared/errors";
import { readSnapshotSummaryCombinationDocument } from "../../shared/snapshot-summaries";
import {
  processWebPages,
  writeWebPageDocument,
} from "../../shared/web-page-documents";
import { skipWebPageBasedOnEnv } from "../../shared/web-page-documents/skip-web-page-based-on-env";
import { updateWebPageAnnotation } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold(
      "Extracting web page annotations from snapshot summary combinations\n",
    ),
  );
  let pagesWithoutSnapshotSummaryCombination = false;

  await syncCollectionIfNeeded({
    output,
    mode: "preliminary",
  });

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

      const snapshotSummaryCombinationDocument =
        await readSnapshotSummaryCombinationDocument(webPageDirPath);

      if (!snapshotSummaryCombinationDocument) {
        pagesWithoutSnapshotSummaryCombination = true;

        return {
          status: "skipped",
          message: "snapshot summary combination not found",
        };
      }

      const updatedAnnotation = updateWebPageAnnotation({
        webPageDocument,
        snapshotSummaryCombinationDocument,
      });
      if (_.isEqual(updatedAnnotation, webPageDocument.annotation)) {
        return {
          status: "skipped",
          message: "annotation has not changed",
        };
      }

      const updatedWebPageDocument = _.clone(webPageDocument);
      updatedWebPageDocument.annotation = updatedAnnotation;

      await writeWebPageDocument(webPageDirPath, updatedWebPageDocument);

      return {
        status: "processed",
        message: "annotation was changed",
      };
    },
  });

  if (pagesWithoutSnapshotSummaryCombination as boolean) {
    output.write(
      chalk.yellow(
        "To avoid missing snapshot summary combinations, make sure you generate snapshots, extract their summaries and summary combinations before running this script.\n",
      ),
    );
  }

  await syncCollectionIfNeeded({
    output,
    message: "Extract annotations from snapshot summary combinations",
  });

  throwExitCodeErrorIfOperationFailed(operationResult);
};

await script();
