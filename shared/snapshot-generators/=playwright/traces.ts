import { BrowserContext, chromium, Page } from "playwright";

import { startTraceServer, TraceServer } from "./traces/trace-server";

let traceServer: TraceServer | undefined;

const restartTraceServer = async (): Promise<TraceServer> => {
  await traceServer?.stopTraceServer();

  traceServer = await startTraceServer();

  return traceServer;
};

let traceBrowserContext: BrowserContext | undefined;

const createPage = async (): Promise<Page> => {
  if (!traceBrowserContext) {
    const traceBrowser = await chromium.launch({
      headless: false,
      args: ["--blink-settings=imagesEnabled=false"], // Reduces chances of crashing
    });
    traceBrowserContext = await traceBrowser.newContext();
  }

  return traceBrowserContext.newPage();
};

export const ensureTraceViewerServerIsStopped = async () => {
  await traceServer?.stopTraceServer();
};

export const openTrace = async (traceFilePath: string): Promise<Page> => {
  const { traceServerPrefix } = await restartTraceServer();
  const page = await createPage();
  page.setDefaultTimeout(120_000);
  page.setDefaultNavigationTimeout(120_000);

  await page.goto(
    `${traceServerPrefix}/trace/index.html?trace=${encodeURIComponent(
      traceFilePath,
    )}`,
  );

  await page.waitForLoadState("networkidle");

  return page;
};

export const gotoLastAction = async (tracePage: Page) => {
  await tracePage.locator(".tabbed-pane .action-entry:last-child").click();
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
