import { Page } from "playwright";

import { SnapshotGeneratorId } from "../snapshot-generator-id";
import { SnapshotContext } from "../snapshot-generators";
import {
  SnapshotSummaryCombinationData,
  SnapshotSummaryCombinationDocument,
  SnapshotSummaryDocument,
} from "../snapshot-summaries";
import { WebPageAnnotation, WebPageDocument } from "../web-page-documents";

export type GenerateWebPageDirPathSegments = (webPageUrl: string) => string[];
export type AssertSourceUrl = (webPageUrl: string) => void;

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (payload: {
  mostRecentSnapshotTime: string;
  snapshotGeneratorId: SnapshotGeneratorId;
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
}) => string | undefined | Promise<string | undefined>;

export type CheckIfSnapshotIsDue = (payload: {
  knownSnapshotTimesInAscOrder: string[];
  snapshotGeneratorId: SnapshotGeneratorId;
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
}) => boolean | Promise<boolean>;

export type CheckContentMatch = (payload: {
  contentRegex: RegExp;
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
}) => boolean | Promise<boolean>;

export interface PlaywrightPageInteractionPayload {
  abortSignal?: AbortSignal | undefined;
  log?: (message: string) => void;
  playwrightPage: Page;
  snapshotContext: SnapshotContext;
}

export type InteractWithPlaywrightPage = (
  payload: PlaywrightPageInteractionPayload,
) => void | Promise<void>;

export type ExtractSnapshotSummaryCombinationData = (payload: {
  snapshotSummaryDocuments: SnapshotSummaryDocument[];
}) => SnapshotSummaryCombinationData;

export type UpdateWebPageAnnotation = (payload: {
  snapshotSummaryCombinationDocument: SnapshotSummaryCombinationDocument;
  webPageDocument: WebPageDocument;
}) => WebPageAnnotation;

export type ExtractRelevantWebPageUrls = (payload: {
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
}) => Promise<string[]>;

export interface WebPageSource {
  assertWebPageUrl: AssertSourceUrl;
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkContentMatch: CheckContentMatch;
  checkIfSnapshotIsDue: CheckIfSnapshotIsDue;
  generateWebPageDirPathSegments: GenerateWebPageDirPathSegments;
  interactWithPlaywrightPage?: InteractWithPlaywrightPage;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
}
