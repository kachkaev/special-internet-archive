export type MatchWebPageUrl = (webPageUrl: string) => boolean;

export const generateAssertWebPageUrlVendor =
  (match: MatchWebPageUrl) =>
  (webPageUrl: string): void => {
    if (!match(webPageUrl)) {
      throw new Error(`URL ${webPageUrl} does not match vendor ${match.name}`);
    }
  };
