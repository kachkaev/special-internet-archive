import path from "node:path";

import _ from "lodash";

import { checkIfTextIsRelevant } from "./check-if-text-is-relevant";
import { checkIfVkAccountIsSignificant } from "./check-if-vk-page-is-significant";
import { getWebPagesDirPath, relevantTimeMin } from "./collection";
import { UserFriendlyError } from "./errors";
import { genericUrlsAreEnabled } from "./experiments";
import {
  readSnapshotSummaryCombinationDocument,
  TempRawVkPhotoInAlbum,
  TempRawVkPost,
} from "./snapshot-summaries";
import { genericWebPageSource } from "./web-page-sources/=generic";
import { vkWebPageSource } from "./web-page-sources/=vk";
import { parseRawVkTime } from "./web-page-sources/=vk/parse-raw-vk-time";
import {
  CalculateRelevantTimeMinForNewIncrementalSnapshot,
  CheckContentMatch,
  CheckIfSnapshotIsDue,
  ExtractRelevantWebPageUrls,
  ExtractSnapshotSummaryCombinationData,
  GetWebPageCreationTime,
  InteractWithPlaywrightPage,
  UpdateWebPageAnnotation,
  WebPageSource,
} from "./web-page-sources/types";

export const webPageSourceLookup = {
  vk: vkWebPageSource,
  generic: genericUrlsAreEnabled ? genericWebPageSource : undefined,
};

type WebPageSourceId = keyof typeof webPageSourceLookup;

const getWebPageSource = (webPageUrl: string): WebPageSource => {
  for (const webpageSourceId in webPageSourceLookup) {
    if (Object.hasOwn(webPageSourceLookup, webpageSourceId)) {
      const webPageSource =
        webPageSourceLookup[webpageSourceId as WebPageSourceId];

      if (!webPageSource) {
        continue;
      }

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

export const getWebPageCreationTime: GetWebPageCreationTime = (webPageUrl) => {
  return getWebPageSource(webPageUrl).getWebPageCreationTime(webPageUrl);
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
    const tempRawVkPhotoInAlbumByUrl: Record<string, TempRawVkPhotoInAlbum> =
      {};

    for (const snapshotSummaryDocument of snapshotSummaryDocuments) {
      for (const tempRawVkPost of snapshotSummaryDocument.tempRawVkPosts ??
        []) {
        tempRawVkPostByUrl[tempRawVkPost.url] = {
          ...tempRawVkPost,
          date: parseRawVkTime(
            tempRawVkPost.date,
            snapshotSummaryDocument.capturedAt,
          ),
        };
      }

      for (const tempRawVkPhotoInAlbum of snapshotSummaryDocument.tempRawVkPhotosInAlbum ??
        []) {
        tempRawVkPhotoInAlbumByUrl[tempRawVkPhotoInAlbum.url] =
          tempRawVkPhotoInAlbum;
      }
    }

    const tempRawVkPosts = _.orderBy(
      Object.values(tempRawVkPostByUrl),
      (tempRawVkPost) => tempRawVkPost.url,
    );

    const tempRawVkPhotosInAlbum = _.orderBy(
      Object.values(tempRawVkPhotoInAlbumByUrl),
      (tempRawVkPost) => tempRawVkPost.url,
    );

    const mostRecentDocument = snapshotSummaryDocuments.at(-1);
    const tempPageDescription = mostRecentDocument?.tempPageDescription;
    const tempPageNotFound = mostRecentDocument?.tempPageNotFound;
    const tempPageTitle = mostRecentDocument?.tempPageTitle;
    const tempPageTitleInfo = mostRecentDocument?.tempPageTitleInfo;
    const tempPageVerified = mostRecentDocument?.tempPageVerified;

    return {
      ...(tempPageDescription ? { tempPageDescription } : {}),
      ...(tempPageNotFound ? { tempPageNotFound } : {}),
      ...(tempPageTitle ? { tempPageTitle } : {}),
      ...(tempPageTitleInfo ? { tempPageTitleInfo } : {}),
      ...(tempPageVerified ? { tempPageVerified } : {}),
      ...(tempRawVkPosts.length > 0 ? { tempRawVkPosts } : {}),
      ...(tempRawVkPhotosInAlbum.length > 0 ? { tempRawVkPhotosInAlbum } : {}),
    };
  };

export const updateWebPageAnnotation: UpdateWebPageAnnotation = ({
  webPageDocument,
}) => {
  // @todo Implement logic and structure for web page annotations

  // Used before 2022-06-11
  if (webPageDocument.annotation["tempRelevantLinks"]) {
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

  const vkAccountIsSignificant = checkIfVkAccountIsSignificant(
    snapshotSummaryCombinationDocument,
  );

  const newLinkSet = new Set<string>();
  for (const tempRawVkPost of snapshotSummaryCombinationDocument.tempRawVkPosts ??
    []) {
    if (
      tempRawVkPost.date >= relevantTimeMin &&
      (vkAccountIsSignificant ||
        tempRawVkPost.text.trim() === "" ||
        checkIfTextIsRelevant(tempRawVkPost.text))
    ) {
      newLinkSet.add(tempRawVkPost.url);
    }
  }

  for (const tempRawVkPhotoInAlbum of snapshotSummaryCombinationDocument.tempRawVkPhotosInAlbum ??
    []) {
    // Wayback Machine snapshots only display the splash screen when both URLs below are captured
    newLinkSet.add(tempRawVkPhotoInAlbum.url);
    newLinkSet.add(`${tempRawVkPhotoInAlbum.url}?rev=1`);
  }

  return [...newLinkSet];
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageSourceLookup)
    .flatMap((source) => (source ? source.listUrlExamples() : []))
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
