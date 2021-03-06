const relevantTerms = [
  " it", // avoid confusion with twitter
  " obi", // avoid confusion with “sdobin”
  " нко", // avoid confusion with “энковский”
  " цен ", // avoid confusion with «цена» in ads
  "chess",
  "covid",
  "ikea",
  "vpn",
  "v",
  "z",
  "авиа",
  "агент",
  "адмирал",
  "азов",
  "ай-ти",
  "айти",
  "апте",
  "арме",
  "арми",
  "аэро",
  "байд",
  "банк",
  "баталь",
  "бежен",
  "безработ",
  "бессмерт",
  "боев",
  "боец",
  "бойц",
  "бригад",
  "валют",
  "вертолет",
  "взрыв",
  "воен",
  "возбужд",
  "возвращени",
  "воин",
  "войн",
  "генерал",
  "георгиев",
  "глава",
  "главе",
  "главнокоманд",
  "граждан",
  "границ",
  "гранич",
  "греч",
  "губерн",
  "дефицит",
  "дивизи",
  "днр",
  "долг",
  "доллар",
  "донба",
  "дружин",
  "евро",
  "займ",
  "занаших",
  "зеленск",
  "из-за ухода",
  "икеа",
  "икея",
  "импорт",
  "инвалид",
  "инвест",
  "иностран",
  "институт",
  "киев",
  "ковид",
  "командир",
  "комбат",
  "комплектующ",
  "корон",
  "кпрф",
  "кредит",
  "крейсер",
  "крым",
  "курорт",
  "лдпр",
  "лейтенант",
  "лекарств",
  "летчик",
  "либерал",
  "лидер",
  "лнр",
  "луганск",
  "магаз",
  "майдан",
  "маршал",
  "мемориал",
  "мигра",
  "милиц",
  "министе",
  "министр",
  "мобилизац",
  "морск",
  "моск",
  "мызaмир",
  "мыработаем",
  "налог",
  "наци",
  "оборон",
  "образован",
  "обстрел",
  "объясняем.рф",
  "объясняемрф",
  "операц",
  "ополчен",
  "отмен",
  "офицер",
  "памят",
  "памятник",
  "пандеми",
  "парти",
  "патриот",
  "пенси",
  "первомай",
  "пилот",
  "плен",
  "побед",
  "погиб",
  "подвиг",
  "поддерж",
  "полиц",
  "полк",
  "полковник",
  "похороны",
  "правитель",
  "прапорщик",
  "презид",
  "продукт",
  "прокуратур",
  "прощание",
  "путин",
  "работайте",
  "революц",
  "рейс",
  "роскомнадзор",
  "росси",
  "рубл",
  "русск",
  "рынок",
  "самолет",
  "санкц",
  "сахар",
  "своихнебросаем",
  "севастополь",
  "сепаратист",
  "сержант",
  "скончал",
  "славян",
  "солдат",
  "соловь",
  "спецоперац",
  "справедлив",
  "ссср",
  "старшина",
  "стрелков",
  "супермарк",
  "сша",
  "теракт",
  "террорист",
  "туризм",
  "турист",
  "украин",
  "умер",
  "университет",
  "фашист",
  "фейк",
  "флагман",
  "флот",
  "херсон",
  "хлопок",
  "ценов",
  "цены",
  "школ",
  "шойг",
  "эваку",
  "экономи",
  "экспорт",
];

/**
 * @todo Improve language matching and make configurable
 */
export const checkIfTextIsRelevant = (text: string): boolean => {
  const textWithoutLinks = text
    .toLocaleLowerCase()
    .replace(
      /[\p{L}#%+.:=@~-]{1,256}\.[\d\p{L}]{1,6}([\p{L}#%&()+./:=?@~-]*)/giu, // URLs https://stackoverflow.com/a/3809435/1818285 + \p{L}
      "",
    )
    .replace(
      /([\w+.-]+@[\w.-]+\.[\w-]+)/gi, // emails https://stackoverflow.com/a/54340560/1818285
      "",
    )
    .replace(/ё/g, "е")
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
