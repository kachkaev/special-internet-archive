import { UserFriendlyError } from "./errors";
import { vkWebPageVendor } from "./web-page-vendors/=vk";
import {
  CalculateRelevantTimeMinForNewIncrementalSnapshot,
  CheckIfNewSnapshotIsDue,
  WebPageVendor,
} from "./web-page-vendors/types";

export const webPageVendorLookup = {
  vk: vkWebPageVendor,
};

type WebPageVendorId = keyof typeof webPageVendorLookup;

const getWebPageVendor = (webPageUrl: string): WebPageVendor => {
  for (const webpageVendorId in webPageVendorLookup) {
    if (Object.hasOwn(webPageVendorLookup, webpageVendorId)) {
      const webPageVendor =
        webPageVendorLookup[webpageVendorId as WebPageVendorId];

      if (webPageVendor.matchWebPageUrl(webPageUrl)) {
        return webPageVendor;
      }
    }
  }

  throw new UserFriendlyError(
    `URL ${webPageUrl} is invalid or is not currently supported.`,
  );
};

export const generateWebPageDirPath = (webPageUrl: string): string => {
  return getWebPageVendor(webPageUrl).generateWebPageDirPath(webPageUrl);
};

export const listWebPageAliases = (webPageUrl: string): string[] => {
  return getWebPageVendor(webPageUrl).listWebPageAliases(webPageUrl);
};

export const calculateRelevantTimeMinForNewIncrementalSnapshot: CalculateRelevantTimeMinForNewIncrementalSnapshot =
  (webPageUrl, mostRecentSnapshotTime) => {
    return getWebPageVendor(
      webPageUrl,
    ).calculateRelevantTimeMinForNewIncrementalSnapshot?.(
      webPageUrl,
      mostRecentSnapshotTime,
    );
  };

export const checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue = (
  webPageUrl,
  mostRecentSnapshotTime,
) => {
  return getWebPageVendor(webPageUrl).checkIfNewSnapshotIsDue(
    webPageUrl,
    mostRecentSnapshotTime,
  );
};

const listWebPageUrlExamples = (): string[] => {
  return Object.values(webPageVendorLookup)
    .flatMap((vendor) => vendor.listUrlExamples())
    .sort();
};

export const generateUrlExamplesMessage = (): string =>
  `Please follow these examples:\n- ${listWebPageUrlExamples().join("\n- ")}\n`;
