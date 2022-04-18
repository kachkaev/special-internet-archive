import { UserFriendlyError } from "./errors";
import { vkWebPageSource } from "./web-page-sources/=vk";
import {
  CalculateRelevantTimeMinForNewIncrementalSnapshot,
  CheckIfSnapshotIsDue,
  ExtractRelevantWebPageUrls,
  ExtractSnapshotSummaryCombinationData,
  UpdateWebPageAnnotation,
  WebPageSource,
} from "./web-page-sources/types";

export const webPageSourceLookup = {
  vk: vkWebPageSource,
};

type WebPageSourceId = keyof typeof webPageSourceLookup;

const getWebPageSource = (webPageUrl: string): WebPageSource => {
  for (const webpageSourceId in webPageSourceLookup) {
    if (Object.hasOwn(webPageSourceLookup, webpageSourceId)) {
      const webPageSource =
        webPageSourceLookup[webpageSourceId as WebPageSourceId];

      try {
        webPageSource.assertWebPageUrl(webPageUrl);

        return webPageSource;
      } catch {
        // noop (trying another source)
      }
    }
  }

  throw new UserFriendlyError(
    `URL ${webPageUrl} is invalid or is not currently supported.`,
  );
};

export const generateWebPageDirPath = (webPageUrl: string): string => {
  return getWebPageSource(webPageUrl).generateWebPageDirPath(webPageUrl);
};

export const listWebPageAliases = (webPageUrl: string): string[] => {
  return getWebPageSource(webPageUrl).listWebPageAliases(webPageUrl);
};

export const calculateRelevantTimeMinForNewIncrementalSnapshot: CalculateRelevantTimeMinForNewIncrementalSnapshot =
  (payload) => {
    return getWebPageSource(
      payload.webPageDocument.webPageUrl,
    ).calculateRelevantTimeMinForNewIncrementalSnapshot?.(payload);
  };

export const checkIfSnapshotIsDue: CheckIfSnapshotIsDue = (payload) => {
  return getWebPageSource(
    payload.webPageDocument.webPageUrl,
  ).checkIfSnapshotIsDue(payload);
};

export const extractSnapshotSummaryCombinationData: ExtractSnapshotSummaryCombinationData =
  () => {
    // @todo Implement
    return { todo: true };
  };

export const updateWebPageAnnotation: UpdateWebPageAnnotation = ({
  webPageDocument,
}) => {
  // @todo Implement
  return webPageDocument.annotation;
};

export const extractRelevantWebPageUrls: ExtractRelevantWebPageUrls = () => {
  // @todo Implement
  return [];
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageSourceLookup)
    .flatMap((source) => source.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
