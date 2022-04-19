import { Browser, chromium } from "playwright";
import sleep from "sleep-promise";

let playwrightBrowser: Browser | "launching" | undefined;

export const getPlaywrightBrowser = async (): Promise<Browser> => {
  while (playwrightBrowser === "launching") {
    await sleep(10);
  }

  if (playwrightBrowser) {
    return playwrightBrowser;
  }

  playwrightBrowser = "launching";
  playwrightBrowser = await chromium.launch({ headless: false });

  return playwrightBrowser;
};

export const closePlaywrightBrowser = async () => {
  if (playwrightBrowser !== "launching") {
    await playwrightBrowser?.close();
  }
};
