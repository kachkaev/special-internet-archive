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
  "live",
  "online",
  "культур",
  "лайв",
  "лайф",
  "новости",
  "онлайн",
  "сейчас",
  "события",
  "типичн",
  "эхо ",
  //
  // "говорит",
  // "знаком",
  // "инцидент",
  // "лютая",
  // "лютое",
  // "лютый",
  // "наш ",
  // "объявления",
  // "говорящ",
  // "дежурн",
  // "чс ",
  // "афиша",
  // "злой",
  // "злое",
  // "злая",
  // "интересн",
  // "подслушано",
  // " инфо",
  // "работа",
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
