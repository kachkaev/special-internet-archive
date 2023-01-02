import axios from "axios";
import chalk from "chalk";
import * as envalid from "envalid";

import { cleanEnv } from "../../shared/clean-env";
import { generateAutoPopulateUrlInbox } from "./shared/generate-auto-populate-url-inbox";

interface WordPressPostInfo {
  id: number;
  link: string;
}

const perPage = 100;

const script = generateAutoPopulateUrlInbox({
  contentsLabel: "WordPress posts",
  listNewUrlInboxRows: async ({ output }) => {
    const env = cleanEnv({
      WORDPRESS_BASE_URL: envalid.str({}),
    });

    const wordpressBaseUrl = env.WORDPRESS_BASE_URL;

    output.write(chalk.green(`Listing posts at ${wordpressBaseUrl}...`));
    const rows: string[] = [];
    let offset = 0;

    for (;;) {
      const { data: postInfos } = await axios.get<WordPressPostInfo[]>(
        `${wordpressBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
        {
          /* eslint-disable @typescript-eslint/naming-convention -- third-party API */
          params: {
            per_page: perPage,
            offset,
          },
          responseType: "json",
          transitional: {
            silentJSONParsing: false, // Disables Object to string conversion if parsing fails
          },
          /* eslint-enable @typescript-eslint/naming-convention -- third-party API */
        },
      );

      if (postInfos.length === 0) {
        break;
      }

      for (const postInfo of postInfos) {
        rows.push(`${postInfo.link}    post=${postInfo.id}`);
      }

      offset += perPage;
      output.write(chalk.green(`${offset}...`));
    }

    output.write(` Done.\n`);

    return rows;
  },
});

await script();
