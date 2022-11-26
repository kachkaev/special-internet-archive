import * as envalid from "envalid";
import { Browser, firefox } from "playwright";
import sleep from "sleep-promise";

import { cleanEnv } from "../../clean-env";

let playwrightBrowser: Browser | "launching" | undefined;

export const getPlaywrightBrowser = async (): Promise<Browser> => {
  while (playwrightBrowser === "launching") {
    await sleep(10);
  }

  if (playwrightBrowser) {
    return playwrightBrowser;
  }

  const env = cleanEnv({
    HEADLESS: envalid.bool({ default: true }),
  });
  const headless = env.HEADLESS;

  playwrightBrowser = "launching";
  playwrightBrowser = await firefox.launch({
    firefoxUserPrefs: {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- https://support.mozilla.org/en-US/questions/981640#answer-516383
      "permissions.default.image": 2,
    },
    headless,
  });

  return playwrightBrowser;
};

export const closePlaywrightBrowser = async () => {
  if (playwrightBrowser !== "launching") {
    await playwrightBrowser?.close();
  }
};
