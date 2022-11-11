import { SnapshotSummaryCombinationDocument } from "./snapshot-summaries";

const significantTitleMatches: Array<string | RegExp> = [
  "администрация",
  "больница",
  "департамент",
  "дума",
  "законодательное собрание",
  "заксобр",
  "министерство",
  "муниципальный район",
  "объясняем",
  "правительство",
  " цур",
  "цур ",
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
  "24",
  "вести",
  "вестник",
  "газета",
  "известия",
  "информ",
  "радио",
  "телеканал",
  //
  "институт",
  "колледж",
  "техникум",
  "университет",
  "факультет",
  "школа",
  /гу$/,
  /гу /,
  //
  "типичн",
  "культур",
  //
  // "live",
  // "online",
  // "говорит",
  // "знаком",
  // "инцидент",
  // "лайв",
  // "лайф",
  // "лютая",
  // "лютое",
  // "лютый",
  // "наш ",
  // "новости",
  // "объявления",
  // "говорящ",
  // "дежурн",
  // "чс ",
  // "афиша",
  // "сейчас",
  // "злой",
  // "интересн",
  // "онлайн",
  // "подслушано",
  // " инфо",
  // "эхо ",
  // "работа",
  // "события",
  // "тревожн",
  // "черный список",
  // "чп ",
];

export const checkIfVkAccountIsSignificant = (
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

  for (const match of significantTitleMatches) {
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
