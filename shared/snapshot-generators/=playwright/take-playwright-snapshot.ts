import { DateTime } from "luxon";
import path from "node:path";
import { chromium, Page } from "playwright";

import { generateWebPageDirPath } from "../../web-page-vendors";
import { TakeSnapshot } from "../types";

const closeAuthModalIfPresent = async (page: Page) => {
  const button = page.locator(".UnauthActionBox__close").nth(0);
  if (await button.isVisible()) {
    await button.click();
  }
};

export const takePlaywrightSnapshot: TakeSnapshot = async ({ webPageUrl }) => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  await context.tracing.start({ snapshots: true });
  const page = await context.newPage();
  await page.goto(webPageUrl);

  const snapshotDateTime = DateTime.utc();

  for (let scrollCount = 0; scrollCount < 5; scrollCount += 1) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await closeAuthModalIfPresent(page);
    await page.waitForLoadState("networkidle");
  }

  await context.tracing.stop({
    path: path.resolve(
      generateWebPageDirPath(webPageUrl),
      "snapshots",
      `${snapshotDateTime.toFormat("yyyy-MM-dd-HHmmss")}z-playwright.zip`,
    ),
  });

  await browser.close();
};
