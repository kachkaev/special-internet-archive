import { JSDOM } from "jsdom";
import { Browser, BrowserContext, Page, webkit } from "playwright";
import sleep from "sleep-promise";

import { startTraceServer, TraceServer } from "./traces/trace-server";

// Inspired by https://github.com/microsoft/playwright/blob/a3b0f0cba86dd6ead900f0635ef4351dfcccc6c7/packages/trace-viewer/src/entries.ts#L21
type ContextEntry = {
  actions: Array<{
    type: "action";
    pageId?: string;
    afterSnapshot?: string;
  }>;
  events: Array<{
    method: "navigated" | string;
    params?: { url: string };
  }>;
};

let traceServer: TraceServer | undefined;

let traceBrowser: Browser | undefined;
let traceBrowserContext: BrowserContext | undefined;

const createPage = async (): Promise<Page> => {
  if (!traceBrowser) {
    traceBrowser = await webkit.launch();
  }
  if (traceBrowserContext) {
    await traceBrowserContext.close();
  }
  traceBrowserContext = await traceBrowser.newContext();

  return traceBrowserContext.newPage();
};

export const ensureTraceViewerIsStopped = async () => {
  await traceServer?.stop();
  await traceBrowser?.close();
  await traceBrowserContext?.close();
};

const timeoutThatToleratesEvenVeryLargeSnapshots = 30 * 1000;

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
    // outside the browser helps avoid crashes.
    // Potential future improvement: https://github.com/microsoft/playwright/issues/9883

    const result = await Promise.race([
      // Promise.race can be removed when page.evaluate() supports timeout option
      // https://github.com/microsoft/playwright/issues/13253
      sleep(timeoutThatToleratesEvenVeryLargeSnapshots) as Promise<void>,
      page.evaluate<{ html: string; url: string | undefined }, string>(
        async (encodedTraceFilePathInEvaluate) => {
          const contextsResponse = await fetch(
            `/trace/contexts?trace=${encodedTraceFilePathInEvaluate}`,
          );

          const [{ actions, events }] = (await contextsResponse.json()) as [
            ContextEntry,
          ];

          const lastAction = [...actions]
            .reverse()
            .find((action) => action.afterSnapshot && action.pageId);

          if (!lastAction) {
            throw new Error("Could not find an action with afterSnapshot");
          }

          const lastNavigation = events.find(
            (event) =>
              event.method === "navigated" &&
              event.params?.url !== "about:blank",
          );

          if (!lastNavigation) {
            throw new Error("Encountered empty lastNavigationMetadata");
          }

          const htmlResponse = await fetch(
            `/trace/snapshot/${lastAction.pageId!}?trace=${encodedTraceFilePathInEvaluate}&name=${lastAction.afterSnapshot!}`,
          );

          return {
            html: await htmlResponse.text(),
            url: lastNavigation.params?.url,
          };
        },
        encodedTraceFilePath,
      ),
    ]);

    if (!result) {
      throw new Error("Trace page crashed (needs fixing)");
    }

    const dom = new JSDOM(result.html, {
      url: result.url,
      contentType: "text/html",
    });

    return await evaluate(dom.window.document.body as HTMLBodyElement);
  } finally {
    await page.close();
  }
};
