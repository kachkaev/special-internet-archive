export type MatchWebPageUrl = (webPageUrl: string) => boolean;

export const generateAssertWebPageUrlSource =
  (match: MatchWebPageUrl) =>
  (webPageUrl: string): void => {
    if (!match(webPageUrl)) {
      throw new Error(`URL ${webPageUrl} does not match source ${match.name}`);
    }
  };
