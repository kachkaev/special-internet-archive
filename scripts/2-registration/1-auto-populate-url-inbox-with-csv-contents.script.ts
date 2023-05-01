import path from "node:path";
import punycode from "node:punycode";

import chalk from "chalk";
import { parse } from "csv-parse";
import * as envalid from "envalid";
import fs from "fs-extra";
import LinkifyIt from "linkify-it";

import { cleanEnv } from "../../shared/clean-env";
import { generateAutoPopulateUrlInbox } from "./shared/generate-auto-populate-url-inbox";

const normalizeUrl = (rawUrl: string): string => {
  const parsedUrl = new URL(rawUrl);

  // Convert the hostname to Punycode
  parsedUrl.hostname = punycode.toASCII(parsedUrl.hostname);

  return encodeURI(decodeURI(parsedUrl.toString()));
};

const extractUrlsFromCsv = async (
  filePath: string,
): Promise<[string[], string[]]> => {
  const normalizedUrls: Set<string> = new Set();
  const malformedUrls: Set<string> = new Set();
  const linkify = new LinkifyIt({
    fuzzyLink: false,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    fuzzyIP: false,
    fuzzyEmail: false,
  });

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    const parser = parse({ delimiter: ",", relax_column_count: true });

    parser
      .on("readable", () => {
        let record: string;
        while ((record = parser.read() as string)) {
          for (const cell of record) {
            // Some URLs are prefixed with -, but we still want to extract them
            const editedCell = cell.replace(/-http(s?):/g, " http$1:");

            const links = linkify.match(editedCell);
            if (links) {
              for (const link of links) {
                try {
                  normalizedUrls.add(normalizeUrl(link.url));
                } catch {
                  malformedUrls.add(link.url);
                }
              }
            }
          }
        }
      })
      .on("end", () => {
        resolve([[...normalizedUrls].sort(), [...malformedUrls].sort()]);
      })
      .on("error", (error) => {
        reject(error);
      });

    fs.createReadStream(filePath).pipe(parser);
  });
};

const script = generateAutoPopulateUrlInbox({
  contentsLabel: "CSV contents",
  listNewUrlInboxRows: async ({ output }) => {
    const env = cleanEnv({
      CSV_FILE_PATH: envalid.str({}),
    });

    const resolveCsvFilePath = path.resolve(env.CSV_FILE_PATH);

    output.write(`Extracting URLs from ${resolveCsvFilePath}...`);
    const [normalizedUrls, malformedUrls] = await extractUrlsFromCsv(
      resolveCsvFilePath,
    );
    output.write(` Done.\n`);

    if (malformedUrls.length > 0) {
      output.write(chalk.yellow("The following URLs are malformed:\n"));
      for (const malformedUrl of malformedUrls) {
        output.write(`  ${chalk.yellow(malformedUrl)}\n`);
      }
    }

    return normalizedUrls;
  },
});

await script();
