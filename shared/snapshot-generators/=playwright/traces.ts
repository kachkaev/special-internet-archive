/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call */
import { createRequire } from "node:module";
import path from "node:path";
import { BrowserContext, chromium, Page } from "playwright";
import sleep from "sleep-promise";

// Context: https://github.com/microsoft/playwright/issues/9883

const traceViewerServerPort = 42_424;

let traceViewerStarted = false;
let traceViewerContext: BrowserContext | undefined;
let traceContext: BrowserContext | undefined;

const ensureTraceViewerServerIsRunning = async (): Promise<void> => {
  if (traceViewerStarted) {
    while (!traceContext) {
      await sleep(100);
    }

    return;
  }
  traceViewerStarted = true;

  const require = createRequire(import.meta.url);

  const importPath = path.resolve(
    path.dirname(require.resolve("playwright-core")),
    "lib/server/trace/viewer/traceViewer.js",
  );

  const { showTraceViewer } = await import(`file://${importPath}`);

  traceViewerContext = await showTraceViewer(
    [],
    "chromium",
    true,
    traceViewerServerPort,
  );

  const traceBrowser = await chromium.launch({ headless: true });
  traceContext = await traceBrowser.newContext();
};

export const ensureTraceViewerServerIsStopped = () => {
  void traceContext?.close();
  void traceViewerContext?.close();

  traceContext = undefined;
  traceViewerContext = undefined;
  traceViewerStarted = false;
};

export const openTrace = async (traceFilePath: string): Promise<Page> => {
  await ensureTraceViewerServerIsRunning();
  const page = await traceContext!.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(20_000);

  await page.goto(
    `http://localhost:${traceViewerServerPort}/trace/index.html?trace=${encodeURIComponent(
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
  await snapshotBody.waitFor({ state: "visible" });

  return snapshotBody.evaluate(evaluate);
};
