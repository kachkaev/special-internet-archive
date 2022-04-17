import { chromium, Page } from "playwright";
import sleep from "sleep-promise";

import { AbortError } from "../../errors";
import { serializeTime } from "../../time";
import { CaptureSnapshot } from "../types";
import { generatePlaywrightSnapshotFilePath } from "./generate-playwright-snapshot-file-path";

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

export const capturePlaywrightSnapshot: CaptureSnapshot = async ({
  abortSignal,
  webPageDirPath,
  webPageUrl,
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

  const capturedAt = serializeTime();

  let scrollingMakesSense = true;
  let authModalAlreadyClosed = false;

  while (scrollingMakesSense) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    if (abortSignal?.aborted) {
      throw new AbortError();
    }

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

    scrollingMakesSense =
      (await page.locator("#wall_more_link").isVisible()) &&
      // @todo Replace with real time checking
      !oldestVisiblePostDateAsText?.match(/1. фев /);
  }

  await loadAllLazyImages(page);

  if (abortSignal?.aborted) {
    throw new AbortError();
  }

  await context.tracing.stop({
    path: generatePlaywrightSnapshotFilePath({
      webPageDirPath,
      capturedAt,
    }),
  });

  await browser.close();
};
