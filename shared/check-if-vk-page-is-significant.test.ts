import { checkIfVkAccountIsSignificant } from "./check-if-vk-page-is-significant";
import { SnapshotSummaryCombinationDocument } from "./snapshot-summaries";

const testCases: Array<{
  document: SnapshotSummaryCombinationDocument;
  significant: boolean;
}> = [
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case1",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "Администрация города Энск",
    },
    significant: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case2",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "ЛолГУ",
    },
    significant: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case3",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "гулаг",
    },
    significant: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case4",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageVerified: true,
      tempPageTitle: "гулаг",
    },
    significant: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case5",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "библиотека имени Гриба",
    },
    significant: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case6",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "блаблатека имени Гриба",
    },
    significant: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case7",
      combinedAt: "2022-01-01T00:00:00.000Z",
    },
    significant: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case8",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempNumberOfFollowers: 10_000,
    },
    significant: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case9",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempNumberOfFollowers: 101_000,
    },
    significant: true,
  },
];

describe("checkIfVkAccountIsSignificant()", () => {
  for (const { document, significant } of testCases) {
    it(`Returns ${String(significant)} for ${document.webPageUrl}`, () => {
      expect(checkIfVkAccountIsSignificant(document)).toBe(significant);
    });
  }
});
