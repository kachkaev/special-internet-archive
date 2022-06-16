import { processWebPages } from "./process-web-pages";

export const generateWebPageDirPathLookup = async (): Promise<
  Record<string, string>
> => {
  const result: Record<string, string> = {};

  await processWebPages({
    // eslint-disable-next-line unicorn/no-useless-undefined
    findReasonToSkipWebPage: () => undefined,
    processWebPage: ({ webPageDocument, webPageDirPath }) => {
      result[webPageDocument.webPageUrl] = webPageDirPath;
    },
  });

  return result;
};
