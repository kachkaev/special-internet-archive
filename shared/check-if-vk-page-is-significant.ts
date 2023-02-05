import * as envalid from "envalid";

import { cleanEnv } from "./clean-env";
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
  "школ",
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
  "совет матерей",
  //
  /г?трк/,
  "24",
  "вести",
  "вестник",
  "газета",
  "известия",
  "информ",
  "правда",
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
  "подслушано",
  "сейчас",
  "события",
  "типичн",
  "тревожн",
  "черный список",
  "чп ",
  "чс ",
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
  // "афиша",
  // "злой",
  // "злое",
  // "злая",
  // "интересн",
  // " инфо",
  // "работа",
];

export const checkIfVkAccountIsSignificant = (
  snapshotSummaryCombinationDocument: SnapshotSummaryCombinationDocument,
): boolean => {
  const env = cleanEnv({
    FORCE_VK_ACCOUNT_IS_SIGNIFICANT: envalid.bool({
      desc: "Treat all VK accounts as significant",
      default: false,
    }),
    VK_ACCOUNT_SIGNIFICANT_FOLLOWER_COUNT: envalid.num({
      desc: "Number of followers to count an account as significant",
      default: 60_000,
    }),
  });

  if (env.FORCE_VK_ACCOUNT_IS_SIGNIFICANT) {
    return true;
  }

  if (snapshotSummaryCombinationDocument.tempPageVerified) {
    return true;
  }

  if (
    (snapshotSummaryCombinationDocument.tempNumberOfFollowers ?? 0) >=
    env.VK_ACCOUNT_SIGNIFICANT_FOLLOWER_COUNT
  ) {
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
