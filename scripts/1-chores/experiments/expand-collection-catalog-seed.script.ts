/* eslint-disable @typescript-eslint/naming-convention */
import chalk from "chalk";
// eslint-disable-next-line import/no-unresolved -- https://github.com/adaltas/node-csv/issues/323
import { parse } from "csv-parse/sync";
// eslint-disable-next-line import/no-unresolved -- https://github.com/adaltas/node-csv/issues/323
import { stringify } from "csv-stringify/sync";
import fs from "fs-extra";
import _ from "lodash";
import path from "node:path";

import { getCollectionCatalogSeedFilePath } from "../../../shared/collection-catalog";
import { UserFriendlyError } from "../../../shared/errors";

const output = process.stdout;

const findColumnIndex = (
  headerCells: string[],
  lowerCaseMatches: string[],
): number => {
  for (const [index, headerCell] of headerCells.entries()) {
    if (lowerCaseMatches.includes(headerCell.toLowerCase())) {
      return index;
    }
  }

  throw new UserFriendlyError(
    `Could not find a column with header "${lowerCaseMatches.join('", "')}"`,
  );
};

interface LinkBatch {
  region_ru: string;
  tag: string;
  links: string[];
}

interface Link {
  regionName: string;
  tag: string;
  url: string;
}

const script = async () => {
  output.write(chalk.bold("Expanding collection catalog seed\n"));

  const collectionCatalogFilePath = getCollectionCatalogSeedFilePath();
  const collectionCatalog = await fs.readFile(
    collectionCatalogFilePath,
    "utf8",
  );

  const [headerCells, ...rows] = parse(collectionCatalog, {
    delimiter: ",",
  }) as [string[], ...string[][]];

  const columnIndexWithUrl = findColumnIndex(headerCells, ["ссылка"]);

  const rowsByUrl: Record<string, string[]> = {};
  for (const [index, row] of rows.entries()) {
    const url = row[columnIndexWithUrl];
    if (url) {
      if (rowsByUrl[url]) {
        output.write(`Duplicate URL on row ${index + 1}: ${url}\n`);
      } else {
        rowsByUrl[url] = row;
      }
    }
  }

  const allLinkBatches = (await fs.readJson(
    path.resolve(
      collectionCatalogFilePath,
      "../../../sia-data-analysis/data/google.com/queries_results_normalized.json",
    ),
  )) as LinkBatch[];

  const filteredLinkBatches = allLinkBatches.filter(
    (linkBatch) => ["министерство"].includes(linkBatch.tag),
    // ["правительство", "администрация", "министерство"].includes(linkBatch.tag),
  );

  const allLinks: Link[] = [];
  for (const linkBatch of filteredLinkBatches) {
    for (const link of linkBatch.links) {
      allLinks.push({
        regionName: linkBatch.region_ru,
        tag: linkBatch.tag,
        url: link,
      });
    }
  }

  const allLinksByUrl = _.groupBy(allLinks, (link) => link.url);
  const linksToAdd: Link[] = [];
  for (const links of Object.values(allLinksByUrl)) {
    if (!links[0]) {
      continue;
    }
    const url = links[0].url;

    if (rowsByUrl[url]) {
      continue;
    }

    if (/[a-z]+-?\d+_\d+$/.test(url)) {
      output.write(
        `${chalk.underline(url)} does not look like an account URL\n`,
      );
      continue;
    }

    const regionNames = _.uniq(links.map((link) => link.regionName));
    if (regionNames.length > 1) {
      output.write(
        `${chalk.underline(
          url,
        )} appears in multiple regions: ${regionNames.join(", ")}\n`,
      );
      continue;
    }

    const combinedTag = _.uniq(links.map((link) => link.tag))
      .sort()
      .join(", ");

    linksToAdd.push({ ...links[0], tag: combinedTag });
  }

  output.write("\n");
  output.write("\n");

  const csv = stringify(
    _.orderBy(linksToAdd, [(link) => link.regionName]).map((link) => [
      link.regionName,
      link.url,
      `[g] ${link.tag}`,
    ]),
  );
  output.write(csv);

  output.write("\n");
  output.write(`Done. Total links: ${linksToAdd.length}\n`);
};

await script();
