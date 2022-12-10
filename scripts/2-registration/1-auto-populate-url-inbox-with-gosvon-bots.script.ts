import axios from "axios";
import chalk from "chalk";

import { generateAutoPopulateUrlInbox } from "./shared/generate-auto-populate-url-inbox";

const botListApiUrl = "https://api.gosvon.net/bots";
interface BotListApiResponse {
  count: number;
  timestamp: string;
  items: string[];
}

const script = generateAutoPopulateUrlInbox({
  contentsLabel: botListApiUrl,
  listWebPageUrls: async ({ output }) => {
    output.write(chalk.green(`Fetching data from ${botListApiUrl}...`));
    const { data } = await axios.get<BotListApiResponse>(botListApiUrl, {
      responseType: "json",
      transitional: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
        silentJSONParsing: false, // Disables Object to string conversion if parsing fails
      },
    });
    output.write(` Done.\n`);

    const webPageUrls = data.items.map(
      (botUserId) => `https://vk.com/id${botUserId}`,
    );

    return webPageUrls;
  },
});

await script();
