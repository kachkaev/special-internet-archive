export type MatchWebPageUrl = (url: string) => boolean;
export type GenerateWebPageDirPath = (url: string) => string;

export interface WebPageVendor {
  matchWebPageUrl: MatchWebPageUrl;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (url: string) => string[];
}
