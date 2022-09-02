const relevantTerms = [
  " it", // avoid confusion with twitter
  " obi", // avoid confusion with “sdobin”
  " всу ", // avoid confusion with misс words
  " нко", // avoid confusion with “энковский”
  " пво",
  " сбу ",
  " сво ",
  " цен ", // avoid confusion with «цена» in ads
  "chess",
  "cola",
  "covid",
  "fanta",
  "ikea",
  "pepsi",
  "sprite",
  "v",
  "vpn",
  "z",
  "авиа",
  "агент",
  "администр",
  "адмирал",
  "азов",
  "ай-ти",
  "айти",
  "академ",
  "активист",
  "апте",
  "арест",
  "арме",
  "арми",
  "аэро",
  "байд",
  "байден",
  "банк",
  "басту",
  "баталь",
  "бежен",
  "безработ",
  "бессмерт",
  "боев",
  "боеприпас",
  "боец",
  "бойц",
  "больниц",
  "бомб",
  "бригад",
  "бункер",
  "бюджет",
  "валют",
  "вдв",
  "вертолет",
  "взрыв",
  "власт",
  "вмф",
  "воен",
  "возбужд",
  "возвращени",
  "воин",
  "войн",
  "войск",
  "волотер",
  "вооруж",
  "враг",
  "вражд",
  "враже",
  "вс рф",
  "выборах",
  "выборы",
  "выплат",
  "гварде",
  "гварди",
  "генерал",
  "георгиев",
  "герое",
  "герои",
  "герой",
  "гибдд",
  "глава",
  "главе",
  "главнокоманд",
  "горбачев",
  "госдеп",
  "госпитал",
  "граждан",
  "границ",
  "гранич",
  "греч",
  "губерн",
  "день",
  "десант",
  "дефицит",
  "дивизи",
  "днр",
  "довольстви",
  "долг",
  "доллар",
  "донба",
  "дорожа",
  "дружин",
  "евро",
  "ефрейтор",
  "забастов",
  "заведен",
  "займ",
  "занаших",
  "заредж",
  "зеленск",
  "из-за ухода",
  "икеа",
  "икея",
  "импорт",
  "инвалид",
  "инвест",
  "иностран",
  "институт",
  "инфляц",
  "истори",
  "капитан",
  "кгб",
  "киев",
  "кинопрокат",
  "кинотеатр",
  "китае",
  "китаи",
  "китай",
  "ковид",
  "командир",
  "команду",
  "комбат",
  "комплектующ",
  "контрактн",
  "концерт",
  "корон",
  "космонав",
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
  "майор",
  "маршал",
  "матрос",
  "мвд",
  "мемориал",
  "мигра",
  "мид р",
  "милиц",
  "министе",
  "министр",
  "митинг",
  "мичнам",
  "мобилизац",
  "могил",
  "морск",
  "моск",
  "мызaмир",
  "мыработаем",
  "наград",
  "налог",
  "наук",
  "науч",
  "наци",
  "не стало",
  "незакон",
  "некролог",
  "нетрадиц",
  "област",
  "оборон",
  "образован",
  "обстрел",
  "объясняем.рф",
  "объясняемрф",
  "онкобольн",
  "онколог",
  "операц",
  "ополчен",
  "оппозиц",
  "отмен",
  "офицер",
  "памят",
  "памятник",
  "пандеми",
  "парад",
  "парти",
  "патриот",
  "пациент",
  "пенси",
  "пепси",
  "первомай",
  "пикет",
  "пилот",
  "плен",
  "побед",
  "погиб",
  "подвиг",
  "поддерж",
  "поликлин",
  "полиц",
  "полк",
  "полковник",
  "полковник",
  "похорон",
  "похороны",
  "правитель",
  "праздн",
  "прапорщик",
  "представител",
  "презид",
  "продукт",
  "прокуратур",
  "прокурор",
  "простились",
  "проститься",
  "протест",
  "прощание",
  "прощаться",
  "прощаются",
  "путин",
  "работайте",
  "радов",
  "разруш",
  "ракет",
  "ранение",
  "ранений",
  "ранения",
  "революц",
  "регион",
  "рейс",
  "ржд",
  "роскомнадзор",
  "росси",
  "рост цен",
  "рсзо",
  "рубл",
  "русск",
  "рынок",
  "рядово",
  "салют",
  "самолет",
  "санкц",
  "сахар",
  "светлая память",
  "своихнебросаем",
  "севастополь",
  "сельскохоз",
  "сельхоз",
  "сепаратист",
  "сержант",
  "сержант",
  "скончал",
  "славян",
  "смерт",
  "солдат",
  "соловь",
  "солтат",
  "спецоперац",
  "справедлив",
  "ссср",
  "старшин",
  "стрелков",
  "супермарк",
  "сша",
  "теракт",
  "террорист",
  "техникум",
  "транзит",
  "туризм",
  "турист",
  "украин",
  "умер",
  "университет",
  "уничтож",
  "учебн",
  "фашист",
  "федерал",
  "федерац",
  "фейерверк",
  "фейк",
  "фестивал",
  "флагман",
  "флот",
  "флот",
  "фсб",
  "фсин",
  "хакер",
  "херсон",
  "хлопки",
  "хлопков",
  "хлопок",
  "ценов",
  "цены",
  "цру",
  "шествие",
  "школ",
  "шойг",
  "штраф",
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
