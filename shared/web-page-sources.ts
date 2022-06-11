import _ from "lodash";
import path from "node:path";

import { checkIfTextIsRelevant } from "./check-if-text-is-relevant";
import { getWebPagesDirPath, relevantTimeMin } from "./collection";
import { UserFriendlyError } from "./errors";
import {
  readSnapshotSummaryCombinationDocument,
  TempRawVkPost,
} from "./snapshot-summaries";
import { vkWebPageSource } from "./web-page-sources/=vk";
import { parseRawVkTime } from "./web-page-sources/=vk/parse-raw-vk-time";
import {
  CalculateRelevantTimeMinForNewIncrementalSnapshot,
  CheckContentMatch,
  CheckIfSnapshotIsDue,
  ExtractRelevantWebPageUrls,
  ExtractSnapshotSummaryCombinationData,
  InteractWithPlaywrightPage,
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
    `URL ${webPageUrl} is invalid or is not currently supported`,
  );
};

export const generateWebPageDirPathSegments = (
  webPageUrl: string,
): string[] => {
  return getWebPageSource(webPageUrl).generateWebPageDirPathSegments(
    webPageUrl,
  );
};

export const generateWebPageDirPath = (webpageUrl: string): string => {
  return path.resolve(
    getWebPagesDirPath(),
    ...generateWebPageDirPathSegments(webpageUrl),
  );
};

export const checkIfWebPageUrlIsAcceptable = (webPageUrl: string): boolean => {
  try {
    generateWebPageDirPathSegments(webPageUrl);

    return true;
  } catch {
    return false;
  }
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

export const checkContentMatch: CheckContentMatch = (payload) => {
  return getWebPageSource(payload.webPageDocument.webPageUrl).checkContentMatch(
    payload,
  );
};

export const interactWithPlaywrightPage: InteractWithPlaywrightPage = async (
  payload,
) => {
  await getWebPageSource(
    payload.playwrightPage.url(),
  ).interactWithPlaywrightPage?.(payload);
};

export const extractSnapshotSummaryCombinationData: ExtractSnapshotSummaryCombinationData =
  ({ snapshotSummaryDocuments }) => {
    // @todo Implement proper logic for various web page types

    const tempRawVkPostByUrl: Record<string, TempRawVkPost> = {};

    for (const snapshotSummaryDocument of snapshotSummaryDocuments) {
      if (!snapshotSummaryDocument.tempRawVkPosts) {
        continue;
      }
      for (const tempRawVkPost of snapshotSummaryDocument.tempRawVkPosts) {
        tempRawVkPostByUrl[tempRawVkPost.url] = {
          ...tempRawVkPost,
          date: parseRawVkTime(
            tempRawVkPost.date,
            snapshotSummaryDocument.capturedAt,
          ),
        };
      }
    }

    return {
      tempRawVkPosts: _.orderBy(
        Object.values(tempRawVkPostByUrl),
        (tempRawVkPost) => tempRawVkPost.url,
      ),
    };
  };

export const updateWebPageAnnotation: UpdateWebPageAnnotation = ({
  webPageDocument,
}) => {
  // @todo Implement logic and structure for web page annotations

  // Used before 2022-06-11
  if (webPageDocument.annotation["tempRawVkPosts"]) {
    return {};
  }

  return webPageDocument.annotation;
};

export const extractRelevantWebPageUrls: ExtractRelevantWebPageUrls = async ({
  webPageDirPath,
}) => {
  const snapshotSummaryCombinationDocument =
    await readSnapshotSummaryCombinationDocument(webPageDirPath);
  if (!snapshotSummaryCombinationDocument) {
    return [];
  }

  const newLinkSet = new Set<string>();
  for (const tempRawVkPost of snapshotSummaryCombinationDocument.tempRawVkPosts ??
    []) {
    if (
      checkIfTextIsRelevant(tempRawVkPost.text) &&
      tempRawVkPost.date >= relevantTimeMin
    ) {
      newLinkSet.add(tempRawVkPost.url);
    }
  }

  return [...newLinkSet];
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageSourceLookup)
    .flatMap((source) => source.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
