import { checkIfVkAccountIsOfficial } from "./check-if-vk-page-is-official";
import { SnapshotSummaryCombinationDocument } from "./snapshot-summaries";

const testCases: Array<{
  document: SnapshotSummaryCombinationDocument;
  official: boolean;
}> = [
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case1",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "Администрация города Энск",
    },
    official: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case2",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "ЛолГУ",
    },
    official: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case3",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "гулаг",
    },
    official: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case4",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageVerified: true,
      tempPageTitle: "гулаг",
    },
    official: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case5",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "библиотека имени Гриба",
    },
    official: true,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case6",
      combinedAt: "2022-01-01T00:00:00.000Z",
      tempPageTitle: "блаблатека имени Гриба",
    },
    official: false,
  },
  {
    document: {
      documentType: "snapshotSummaryCombination",
      webPageUrl: "https://vk.com/case6",
      combinedAt: "2022-01-01T00:00:00.000Z",
    },
    official: false,
  },
];

describe("checkIfVkAccountIsOfficial()", () => {
  for (const { document, official } of testCases) {
    it(`Returns ${String(official)} for ${document.webPageUrl}`, () => {
      expect(checkIfVkAccountIsOfficial(document)).toBe(official);
    });
  }
});
