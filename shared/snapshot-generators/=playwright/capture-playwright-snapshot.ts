import { Page } from "playwright";
import sleep from "sleep-promise";

import { AbortError, getErrorMessage } from "../../errors";
import { serializeTime } from "../../time";
import { interactWithPlaywrightPage } from "../../web-page-sources";
import { CaptureSnapshot } from "../types";
import { getPlaywrightBrowser } from "./browser";
import { generatePlaywrightSnapshotFilePath } from "./generate-playwright-snapshot-file-path";

const tryLoadingAllImages = async (playwrightPage: Page) => {
  await playwrightPage.evaluate(() => {
    for (const img of window.document.querySelectorAll("img")) {
      img.setAttribute("loading", "eager");
    }
  });
  await sleep(100);
  await playwrightPage.waitForLoadState("load");
  await playwrightPage.waitForLoadState("networkidle");
};

export const capturePlaywrightSnapshot: CaptureSnapshot = async ({
  abortSignal,
  reportIssue,
  snapshotContext,
  webPageDirPath,
  webPageUrl,
}) => {
  const browser = await getPlaywrightBrowser();
  const timezoneId = "Europe/Moscow";
  const playwrightContext = await browser.newContext({
    locale: "ru-RU",
    timezoneId,
  });

  try {
    await playwrightContext.tracing.start({ snapshots: true });
    const playwrightPage = await playwrightContext.newPage();
    await playwrightPage.goto(webPageUrl);
    await playwrightPage.waitForLoadState("networkidle");

    const capturedAt = serializeTime();

    await interactWithPlaywrightPage({
      abortSignal,
      log: (message) => {
        reportIssue?.(`Playwright: ${message}`);
      },
      playwrightPage,
      snapshotContext,
    });

    if (abortSignal?.aborted) {
      throw new AbortError();
    }

    await tryLoadingAllImages(playwrightPage);

    if (abortSignal?.aborted) {
      throw new AbortError();
    }

    await playwrightContext.tracing.stop({
      path: generatePlaywrightSnapshotFilePath({
        webPageDirPath,
        capturedAt,
      }),
    });
  } catch (error) {
    if (error instanceof AbortError) {
      throw error;
    }

    return { status: "failed", message: getErrorMessage(error) };
  } finally {
    await playwrightContext.close();
  }

  return { status: "processed" };
};
