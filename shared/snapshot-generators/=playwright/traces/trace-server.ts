/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return */

// Context: https://github.com/microsoft/playwright/issues/9883
// Based on: https://github.com/microsoft/playwright/blob/abced7223c5fc724615ca9410896fe5874552f08/packages/playwright-core/src/server/trace/viewer/traceViewer.ts#L37-L52

import { createRequire } from "node:module";
import path from "node:path";

import getPort from "get-port";

export interface TraceServer {
  stop: () => Promise<void>;
  urlPrefix: string;
}

export const startTraceServer = async (): Promise<TraceServer> => {
  const require = createRequire(import.meta.url);
  const port = await getPort();

  const httpServerPath = path.resolve(
    path.dirname(require.resolve("playwright-core")),
    "lib/utils/httpServer.js",
  );

  const webpackTraceViewerDirPath = path.resolve(
    path.dirname(require.resolve("playwright-core")),
    "lib/vite/traceViewer",
  );

  const { HttpServer } = await import(`file://${httpServerPath}`);

  const server = new HttpServer();
  server.routePrefix("/trace", (request: Request, response: Response) => {
    const url = new URL(`http://localhost${request.url}`);
    const relativePath = url.pathname.slice("/trace".length);
    if (relativePath.startsWith("/file")) {
      try {
        return server.serveFile(
          request,
          response,
          url.searchParams.get("path")!,
        );
      } catch {
        return false;
      }
    }
    const absolutePath = path.join(
      webpackTraceViewerDirPath,
      ...relativePath.split("/"),
    );

    return server.serveFile(request, response, absolutePath);
  });

  await server.start(port);

  return {
    urlPrefix: server.urlPrefix("precise"),
    stop: async () => {
      await server.stop();
    },
  };
};
