import { DateTime } from "luxon";
import path from "node:path";
import { chromium, Page } from "playwright";
import sleep from "sleep-promise";

import { generateWebPageDirPath } from "../../web-page-vendors";
import { TakeSnapshot } from "../types";

const closeAuthModalIfPresent = async (page: Page): Promise<boolean> => {
  const button = page.locator(".UnauthActionBox__close").nth(0);
  if (await button.isVisible()) {
    await button.click();

    return true;
  }

  return false;
};

const loadAllLazyImages = async (page: Page) => {
  await page.evaluate(() => {
    for (const img of window.document.querySelectorAll("img")) {
      img.setAttribute("loading", "eager");
    }
  });

  await page.waitForLoadState("networkidle");
};

export const takePlaywrightSnapshot: TakeSnapshot = async ({
  webPageUrl,
  // snapshotContext,
}) => {
  const timezoneId = "Europe/Moscow";
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: "ru-RU",
    timezoneId,
  });
  await context.tracing.start({ snapshots: true });
  const page = await context.newPage();
  await page.goto(webPageUrl);

  const snapshotDateTime = DateTime.utc();

  let scrollingMakesSense = true;
  let authModalAlreadyClosed = false;

  while (scrollingMakesSense) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await sleep(100);
    await page
      .locator("#wall_more_link #btn_lock")
      .waitFor({ state: "detached" });

    if (!authModalAlreadyClosed) {
      authModalAlreadyClosed = await closeAuthModalIfPresent(page);
    }

    const wallPostsMoreLocators = page.locator(".wall_post_more:visible");
    while ((await wallPostsMoreLocators.count()) > 0) {
      await wallPostsMoreLocators.nth(0).click();
    }

    const oldestVisiblePostDateAsText = await page
      .locator(".post .post_date")
      .last()
      .textContent();

    // const oldestVisiblePostDateAsDateTime = DateTime.fromFormat(
    //   oldestVisiblePostDateText,
    //   "",
    //   { locale: "ru-RU", zone: timezoneId },
    // );

    scrollingMakesSense =
      (await page.locator("#wall_more_link").isVisible()) &&
      // @todo Replace with real time checking
      !oldestVisiblePostDateAsText?.match(/1. фев /);
  }

  await loadAllLazyImages(page);

  // await context.tracing.startChunk();

  // await page.evaluate(() => {});

  await context.tracing.stop({
    path: path.resolve(
      generateWebPageDirPath(webPageUrl),
      "snapshots",
      `${snapshotDateTime.toFormat("yyyy-MM-dd-HHmmss")}z-playwright.zip`,
    ),
  });

  await browser.close();
};
