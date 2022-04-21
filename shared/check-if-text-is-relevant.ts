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
  "объясняем.рф",
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
    .replace(
      /[\w#%+.:=@~-]{1,256}\.[\d()a-z]{1,6}\b([\w\p{L}#%&()+./:=?@~-]*)/giu, // URLs https://stackoverflow.com/a/3809435/1818285 + \p{L}
      "",
    )
    .replace(
      /([\w+.-]+@[\w.-]+\.[\w-]+)/gi, // emails https://stackoverflow.com/a/54340560/1818285
      "",
    )
    .replace(
      /@\w+/g, // @mentions
      "",
    );

  for (const relevantTerm of relevantTerms) {
    if (textWithoutLinks.includes(relevantTerm)) {
      return true;
    }
  }

  return false;
};
