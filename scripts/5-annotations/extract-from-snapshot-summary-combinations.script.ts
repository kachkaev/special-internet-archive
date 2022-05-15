import chalk from "chalk";
import _ from "lodash";

import {
  checkIfCollectionHasUncommittedChanges,
  syncCollectionIfNeeded,
} from "../../shared/collection-syncing";
import {
  checkIfSnapshotSummaryCombinationDocumentExists,
  readSnapshotSummaryCombinationDocument,
} from "../../shared/snapshot-summaries";
import {
  processWebPages,
  writeWebPageDocument,
} from "../../shared/web-page-documents";
import { updateWebPageAnnotation } from "../../shared/web-page-sources";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold(
      "Extracting web page annotations from snapshot summary combinations\n",
    ),
  );
  let pagesWithoutSnapshotSummaryCombination = false;

  const collectionHadUncommittedChanges =
    await checkIfCollectionHasUncommittedChanges();

  await processWebPages({
    output,
    processWebPage: async ({ webPageDirPath, webPageDocument }) => {
      if (
        !(await checkIfSnapshotSummaryCombinationDocumentExists(webPageDirPath))
      ) {
        output.write(chalk.yellow("snapshot summary combination not found"));
        pagesWithoutSnapshotSummaryCombination = true;

        return;
      }

      const snapshotSummaryCombinationDocument =
        await readSnapshotSummaryCombinationDocument(webPageDirPath);

      const updatedAnnotation = updateWebPageAnnotation({
        webPageDocument,
        snapshotSummaryCombinationDocument,
      });

      if (_.isEqual(updatedAnnotation, webPageDocument.annotation)) {
        output.write(chalk.gray("annotation has not changed"));

        return;
      }

      const updatedWebPageDocument = _.clone(webPageDocument);
      updatedWebPageDocument.annotation = updatedAnnotation;

      await writeWebPageDocument(webPageDirPath, updatedWebPageDocument);

      output.write(chalk.magenta("annotation was changed"));
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
    message: collectionHadUncommittedChanges
      ? undefined
      : `Extract annotations from snapshot summary combinations`,
  });
};

await script();
