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

const timeoutThatToleratesEvenVeryLargeSnapshots = 5 * 60 * 1000;

export const evaluateLastSnapshotInTrace = async <T>(
  traceFilePath: string,
  evaluate: (body: HTMLBodyElement) => T | Promise<T>,
): Promise<T> => {
  await traceServer?.stop();
  traceServer = await startTraceServer();

  const page = await createPage();
  page.setDefaultTimeout(timeoutThatToleratesEvenVeryLargeSnapshots);
  page.setDefaultNavigationTimeout(timeoutThatToleratesEvenVeryLargeSnapshots);

  const encodedTraceFilePath = encodeURIComponent(traceFilePath);

  await page.goto(
    `${traceServer.urlPrefix}/trace/index.html?trace=${encodedTraceFilePath}`,
  );

  await page.waitForLoadState("networkidle");

  try {
    // When a large trace file is navigated via Playwright UI, the browser may crash.
    // Making direct calls to the service worker and rendering the last snapshot
    // without the iframe and its surrounding UI helps avoid crashes.
    // Potential future improvement: https://github.com/microsoft/playwright/issues/9883
    await page.goto(
      `${traceServer.urlPrefix}/trace/context?trace=${encodedTraceFilePath}`,
    );

    const rawJson = await page.locator("pre").textContent();

    const { actions } = JSON.parse(rawJson ?? "") as {
      actions: Array<{ metadata: { id: string; pageId: string } }>;
    };
    const lastActionMetadata = actions.at(-1)?.metadata;

    if (!lastActionMetadata) {
      throw new Error("Encountered empty lastActionMetadata");
    }

    await page.goto(
      `${traceServer.urlPrefix}/trace/snapshot/${lastActionMetadata.pageId}?trace=${encodedTraceFilePath}&name=after@${lastActionMetadata.id}`,
    );
    await page.waitForLoadState("networkidle");

    const snapshotBody = page.locator("body");

    return snapshotBody.evaluate(evaluate);
  } finally {
    await page.close();
  }
};
