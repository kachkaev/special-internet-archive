import { processWebPages } from "./process-web-pages";

export const generateWebPageDirPathLookup = async (): Promise<
  Record<string, string>
> => {
  const result: Record<string, string> = {};

  await processWebPages({
    processWebPage: ({ webPageDocument, webPageDirPath }) => {
      result[webPageDocument.webPageUrl] = webPageDirPath;
    },
  });

  return result;
};
