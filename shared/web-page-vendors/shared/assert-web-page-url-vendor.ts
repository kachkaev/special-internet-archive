import { MatchWebPageUrl } from "../types";

export const assertWebPageUrlVendor = (
  webPageUrl: string,
  match: MatchWebPageUrl,
): void => {
  if (!match(webPageUrl)) {
    throw new Error(`URL ${webPageUrl} does not match vendor ${match.name}`);
  }
};
