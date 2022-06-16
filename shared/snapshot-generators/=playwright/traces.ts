import { JSDOM } from "jsdom";
import { Browser, BrowserContext, chromium, Page } from "playwright";

import { startTraceServer, TraceServer } from "./traces/trace-server";

let traceServer: TraceServer | undefined;

let traceBrowser: Browser | undefined;
let traceBrowserContext: BrowserContext | undefined;

const createPage = async (): Promise<Page> => {
  if (!traceBrowserContext) {
    traceBrowser = await chromium.launch({
      args: ["--blink-settings=imagesEnabled=false"], // Reduces chances of crashing
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
    // outside the browser helps avoid crashes.
    // Potential future improvement: https://github.com/microsoft/playwright/issues/9883

    const { html, url } = await page.evaluate<
      { html: string; url: string | undefined },
      string
    >(async (encodedTraceFilePathInEvaluate) => {
      const contextResponse = await fetch(
        `/trace/context?trace=${encodedTraceFilePathInEvaluate}`,
      );
      const { actions, events } = (await contextResponse.json()) as {
        actions: Array<{ metadata: { id: string; pageId: string } }>;
        events: Array<{
          metadata?: {
            method: "navigated";
            params?: { url: string };
          };
        }>;
      };

      const lastActionMetadata = actions.at(-1)?.metadata;
      const lastNavigationMetadata = events.find(
        (event) =>
          event.metadata?.method === "navigated" &&
          event.metadata.params?.url !== "about:blank",
      );

      if (!lastActionMetadata) {
        throw new Error("Encountered empty lastActionMetadata");
      }

      const htmlResponse = await fetch(
        `/trace/snapshot/${lastActionMetadata.pageId}?trace=${encodedTraceFilePathInEvaluate}&name=after@${lastActionMetadata.id}`,
      );

      return {
        html: await htmlResponse.text(),
        url: lastNavigationMetadata?.metadata?.params?.url,
      };
    }, encodedTraceFilePath);

    const dom = new JSDOM(html, { url, contentType: "text/html" });

    return await evaluate(dom.window.document.body as HTMLBodyElement);
  } finally {
    await page.close();
  }
};
