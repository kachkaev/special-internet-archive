import chalk from "chalk";
import _ from "lodash";
import { randomUUID } from "node:crypto";

import {
  getUrlInboxFilePath,
  readUrlInboxRows,
} from "../../../shared/collection";
import { OperationResult } from "../../../shared/operations";
import {
  readSnapshotQueueDocument,
  SnapshotQueueItem,
  writeSnapshotQueueDocument,
} from "../../../shared/snapshot-queues";
import { serializeTime } from "../../../shared/time";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Forwarding URL inbox to Wayback Machine queue\n"));

  output.write(
    `${chalk.green("URL inbox location:")} ${getUrlInboxFilePath()}\n`,
  );

  const urlInboxRows = await readUrlInboxRows();
  if (!urlInboxRows) {
    output.write(chalk.yellow("File is empty.\n"));

    return;
  }

  const maxRowLength = _.max(urlInboxRows.map((row) => row.text.length)) ?? 0;

  const existingSnapshotQueueDocument = await readSnapshotQueueDocument(
    "waybackMachine",
  );
  const newQueueItems = [...existingSnapshotQueueDocument.items];
  const newQueueItemAddedAt = serializeTime();

  for (const urlInboxRow of urlInboxRows) {
    output.write(`\n${chalk.blue(urlInboxRow.text.padEnd(maxRowLength + 1))}`);

    if (urlInboxRow.type !== "url") {
      if (urlInboxRow.text.trim().length > 0) {
        output.write(`${chalk.yellow("not a URL")}`);
      }
      continue;
    }

    let operationResult: OperationResult;

    const existingQueueItem = existingSnapshotQueueDocument.items.find(
      (item) => item.webPageUrl === urlInboxRow.url,
    );

    if (urlInboxRow.url.match("vk.com/")) {
      operationResult = { status: "skipped", message: "does not match filter" };
    } else if (existingQueueItem) {
      operationResult = { status: "skipped", message: "already in queue" };
    } else {
      const newQueueItem: SnapshotQueueItem = {
        id: randomUUID(),
        webPageUrl: urlInboxRow.url,
        addedAt: newQueueItemAddedAt,
      };
      newQueueItems.push(newQueueItem);
      operationResult = { status: "processed" };
    }

    switch (operationResult.status) {
      case "failed": {
        output.write(chalk.yellow(operationResult.message ?? "unknown error"));
        break;
      }
      case "processed": {
        output.write(chalk.magenta("added to queue"));
        break;
      }

      case "skipped": {
        output.write(chalk.gray(operationResult.message ?? "already in queue"));
        break;
      }
    }
  }

  output.write("\n");
  output.write("\n");

  await writeSnapshotQueueDocument({
    ...existingSnapshotQueueDocument,
    items: newQueueItems,
  });

  output.write("Done.\n");
};

await script();
