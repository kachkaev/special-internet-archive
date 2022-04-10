import { MatchWebPageUrl } from "../types";

export const assertWebPageUrlVendor = (
  url: string,
  match: MatchWebPageUrl,
): void => {
  if (!match(url)) {
    throw new Error(`Url ${url} does not match vendor ${match.name}`);
  }
};
