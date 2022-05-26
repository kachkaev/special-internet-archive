import _ from "lodash";

import { checkIfTextIsRelevant } from "./check-if-text-is-relevant";
import { relevantTimeMin } from "./collection";
import { UserFriendlyError } from "./errors";
import { TempRawVkPost } from "./snapshot-summaries";
import { vkWebPageSource } from "./web-page-sources/=vk";
import { parseRawVkTime } from "./web-page-sources/=vk/parse-raw-vk-time";
import {
  CalculateRelevantTimeMinForNewIncrementalSnapshot,
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

const checkIfSetsAreEqual = (setA: Set<unknown>, setB: Set<unknown>) => {
  if (setA.size !== setB.size) {
    return false;
  }
  for (const a of setA) {
    if (!setB.has(a)) {
      return false;
    }
  }

  return true;
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

export const generateWebPageDirPath = (webPageUrl: string): string => {
  return getWebPageSource(webPageUrl).generateWebPageDirPath(webPageUrl);
};

export const checkIfWebPageUrlIsAcceptable = (webPageUrl: string): boolean => {
  try {
    generateWebPageDirPath(webPageUrl);

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
  snapshotSummaryCombinationDocument,
}) => {
  // @todo Implement proper logic and structure for web page annotations

  if (!snapshotSummaryCombinationDocument.tempRawVkPosts) {
    return webPageDocument.annotation;
  }

  const existingLinkSet = new Set(
    webPageDocument.annotation.tempRelevantLinks ?? [],
  );

  const newLinkSet = new Set<string>();
  for (const tempRawVkPost of snapshotSummaryCombinationDocument.tempRawVkPosts) {
    if (
      checkIfTextIsRelevant(tempRawVkPost.text) &&
      tempRawVkPost.date >= relevantTimeMin
    ) {
      newLinkSet.add(tempRawVkPost.url);
    }
  }

  if (checkIfSetsAreEqual(existingLinkSet, newLinkSet)) {
    return webPageDocument.annotation;
  }

  return { tempRelevantLinks: _.orderBy([...newLinkSet]) };
};

export const extractRelevantWebPageUrls: ExtractRelevantWebPageUrls = ({
  webPageDocument,
}) => {
  return webPageDocument.annotation.tempRelevantLinks ?? [];
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageSourceLookup)
    .flatMap((source) => source.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
