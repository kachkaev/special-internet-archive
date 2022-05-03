const relevantTerms = [
  "chess",
  "covid",
  "ikea",
  " it", // avoid confusion with twitter
  "obi",
  "v",
  "z",
  "азов",
  "ай-ти",
  "айти",
  "апте",
  "арме",
  "арми",
  "байд",
  "банк",
  "баталь",
  "бессмерт",
  "валют",
  "воен",
  "возвращени",
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
  "из-за ухода",
  "икеа",
  "икея",
  "импорт",
  "киев",
  "комплектующ",
  "корон",
  "кредит",
  "лекарств",
  "либерал",
  "лнр",
  "магаз",
  "мигра",
  "моск",
  "мызaмир",
  "мыработаем",
  "налог",
  "наци",
  "объясняем.рф",
  "памят",
  "пандеми",
  "патриот",
  "плен",
  "побед",
  "погиб",
  "правитель",
  "презид",
  "продукт",
  "путин",
  "роскомнадзор",
  "росси",
  "рубл",
  "рынок",
  "санкц",
  "сахар",
  "своихнебросаем",
  "соловь",
  "спецоперац",
  "справедлив",
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
