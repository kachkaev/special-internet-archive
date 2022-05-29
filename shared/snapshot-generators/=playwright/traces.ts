import { Browser, BrowserContext, Page, webkit } from "playwright";

import { startTraceServer, TraceServer } from "./traces/trace-server";

let traceServer: TraceServer | undefined;

let traceBrowser: Browser | undefined;
let traceBrowserContext: BrowserContext | undefined;

const createPage = async (): Promise<Page> => {
  if (!traceBrowserContext) {
    // Chromium has been crashing for large traces (approx > 500 MB), so using webkit instead
    // traceBrowser = await chromium.launch({
    //   args: ["--blink-settings=imagesEnabled=false"], // Reduces chances of crashing
    // });

    traceBrowser = await webkit.launch({
      headless: true,
    });

    traceBrowserContext = await traceBrowser.newContext();
  }

  return traceBrowserContext.newPage();
};

export const ensureTraceViewerIsStopped = async () => {
  await traceServer?.stop();
  await traceBrowser?.close();
  await traceBrowserContext?.close();
};

export const openTrace = async (traceFilePath: string): Promise<Page> => {
  await traceServer?.stop();
  traceServer = await startTraceServer();

  const page = await createPage();
  page.setDefaultTimeout(120_000);
  page.setDefaultNavigationTimeout(120_000);

  await page.goto(
    `${traceServer.urlPrefix}/trace/index.html?trace=${encodeURIComponent(
      traceFilePath,
    )}`,
  );

  await page.waitForLoadState("networkidle");

  return page;
};

export const gotoAction = async (tracePage: Page, actionIndex: number) => {
  await tracePage
    .locator(
      `.tabbed-pane .action-entry:${
        actionIndex > 0
          ? `nth-child(${actionIndex})`
          : `nth-last-child(${-actionIndex})`
      }`,
    )
    .click();

  await tracePage.waitForLoadState("networkidle");
};

export const evaluateSnapshot = async <T>(
  tracePage: Page,
  evaluate: (body: HTMLBodyElement) => T | Promise<T>,
): Promise<T> => {
  const snapshotBody = tracePage.frameLocator("#snapshot").locator("body");
  await snapshotBody.waitFor({ state: "attached" });

  return snapshotBody.evaluate(evaluate);
};
