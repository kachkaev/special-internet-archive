import { SnapshotSummaryCombinationDocument } from "./snapshot-summaries";

const officialTitleMatches: Array<string | RegExp> = [
  "администрация",
  "муниципальный район",
  "министерство",
  "правительство",
  "департамент",
  "дума",
  "законодательное собрание",
  "заксобр",
  "цур ",
  " цур",
  "объясняем",
  /^мин/,
  /^деп/,
  /^дом (офицеров|культуры|молодежи)/,
  "библиоте",
  //
  "единая россия",
  "кпрф",
  "онф",
  "народный фронт",
  "молодая гвардия",
  "лдпр",
  "справедливая россия",
  "яблоко",
  "новые люди",
  "навальн",
  //
  /г?трк/,
  "известия",
  "вести",
  "вестник",
  "газета",
  "информ",
  "телеканал",
  "радио",
  //
  "университет",
  "институт",
  "факультет",
  "колледж",
  "школа",
  /гу$/,
  /гу /,
];

export const checkIfVkAccountIsOfficial = (
  snapshotSummaryCombinationDocument: SnapshotSummaryCombinationDocument,
): boolean => {
  if (snapshotSummaryCombinationDocument.tempPageVerified) {
    return true;
  }

  if (!snapshotSummaryCombinationDocument.tempPageTitle) {
    return false;
  }

  const normalizedTitle = snapshotSummaryCombinationDocument.tempPageTitle
    .toLowerCase()
    .replace(/ё/g, "е");

  for (const match of officialTitleMatches) {
    if (typeof match === "string") {
      if (normalizedTitle.includes(match)) {
        return true;
      }
    } else {
      if (match.test(normalizedTitle)) {
        return true;
      }
    }
  }

  return false;
};
