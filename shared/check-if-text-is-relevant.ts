const relevantTerms = [
  "covid",
  "v",
  "z",
  "азов",
  "апте",
  "арме",
  "арми",
  "байд",
  "банк",
  "баталь",
  "валют",
  "воен",
  "воин",
  "войн",
  "глав",
  "граждан",
  "греч",
  "губерн",
  "днр",
  "долг",
  "доллар",
  "донба",
  "евро",
  "займ",
  "зеленск",
  "импорт",
  "киев",
  "корон",
  "кредит",
  "лекарств",
  "лнр",
  "магаз",
  "мигра",
  "моск",
  "мызaмир",
  "налог",
  "наци",
  "памят",
  "пандеми",
  "побед",
  "погиб",
  "правитель",
  "презид",
  "продукт",
  "путин",
  "росси",
  "рубл",
  "рынок",
  "санкц",
  "сахар",
  "своихнебросаем",
  "спецоперац",
  "ссср",
  "супермарк",
  "сша",
  "украин",
  "фашист",
  "фейк",
  "цен",
  "эваку",
  "экономи",
  "экспорт",
];

/**
 * @todo Improve language matching and make configurable
 */
export const checkIfTextIsRelevant = (text: string): boolean => {
  const textWithoutLinks = text
    .replace(/https?:\/\/\S+/g, "") // URLs
    .replace(/@\w+/g, ""); // @mentions

  for (const relevantTerm of relevantTerms) {
    if (textWithoutLinks.includes(relevantTerm)) {
      return true;
    }
  }

  return false;
};
