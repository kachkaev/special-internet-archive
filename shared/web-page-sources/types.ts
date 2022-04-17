import {
  SnapshotSummaryCombinationData,
  SnapshotSummaryCombinationDocument,
  SnapshotSummaryDocument,
} from "../snapshot-summaries";
import { WebPageAnnotation, WebPageDocument } from "../web-page-documents";

export type GenerateWebPageDirPath = (webPageUrl: string) => string;
export type AssertSourceUrl = (webPageUrl: string) => void;

export type CalculateRelevantTimeMinForNewIncrementalSnapshot = (payload: {
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
  mostRecentSnapshotTime: string;
}) => string | undefined | Promise<string | undefined>;

export type CheckIfNewSnapshotIsDue = (payload: {
  webPageDirPath: string;
  webPageDocument: WebPageDocument;
  knownSnapshotTimesInAscOrder: string[];
}) => boolean | Promise<boolean>;

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
}) => string[];

export interface WebPageSource {
  calculateRelevantTimeMinForNewIncrementalSnapshot?: CalculateRelevantTimeMinForNewIncrementalSnapshot;
  checkIfNewSnapshotIsDue: CheckIfNewSnapshotIsDue;
  generateWebPageDirPath: GenerateWebPageDirPath;
  listUrlExamples: () => string[];
  listWebPageAliases: (webPageUrl: string) => string[];
  assertWebPageUrl: AssertSourceUrl;
}
