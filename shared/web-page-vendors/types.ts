export type MatchWebPageUrl = (webPageUrl: string) => boolean;
export type GenerateWebPageDirPath = (webPageUrl: string) => string;

export interface WebPageVendor {
  matchWebPageUrl: MatchWebPageUrl;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
}
