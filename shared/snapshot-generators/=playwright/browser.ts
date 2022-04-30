import * as envalid from "envalid";
import { Browser, chromium } from "playwright";
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
  playwrightBrowser = await chromium.launch({ headless });

  return playwrightBrowser;
};

export const closePlaywrightBrowser = async () => {
  if (playwrightBrowser !== "launching") {
    await playwrightBrowser?.close();
  }
};
