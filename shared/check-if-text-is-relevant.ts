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
  "абитур",
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
  "бензин",
  "бессмерт",
  "боев",
  "боеприпас",
  "боец",
  "бойц",
  "больниц",
  "бомб",
  "бригад",
  "брон",
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
  "возгоран",
  "воин",
  "войн",
  "войск",
  "волотер",
  "вооруж",
  "враг",
  "вражд",
  "враже",
  "вс рф",
  "вциом",
  "выборах",
  "выборы",
  "выплат",
  "газ",
  "гварде",
  "гварди",
  "генерал",
  "георгиев",
  "герое",
  "герои",
  "герой",
  "гибдд",
  "гибел",
  "гимназ",
  "глава",
  "главе",
  "главнокоманд",
  "голосов",
  "горбачев",
  "госдеп",
  "госпитал",
  "граждан",
  "границ",
  "гранич",
  "греч",
  "губерн",
  "дембел",
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
  "загорел",
  "займ",
  "занаших",
  "заредж",
  "звани",
  "зеленск",
  "земляк",
  "из-за ухода",
  "избирател",
  "икеа",
  "икея",
  "импорт",
  "инвалид",
  "инвест",
  "иностран",
  "институт",
  "инфляц",
  "истори",
  "кадет",
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
  "курсант",
  "лдпр",
  "левада",
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
  "мариупол",
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
  "мобилиз",
  "могил",
  "морск",
  "моск",
  "мывместе",
  "мызaмир",
  "мыработаем",
  "навык",
  "наград",
  "награжден",
  "налог",
  "наук",
  "науч",
  "наци",
  "не стало",
  "незакон",
  "некролог",
  "нетрадиц",
  "нефт",
  "обеспеч",
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
  "отсрочк",
  "офицер",
  "памят",
  "памятник",
  "пандеми",
  "паник",
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
  "пожар",
  "полигон",
  "поликлин",
  "полиц",
  "полк",
  "полковник",
  "посмертн",
  "похорон",
  "правитель",
  "праздн",
  "прапорщик",
  "представител",
  "презид",
  "призыв",
  "присяг",
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
  "режим",
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
  "скончал",
  "славян",
  "слажив",
  "служб",
  "смерт",
  "снайпер",
  "соболезн",
  "солдат",
  "соловь",
  "солтат",
  "социолог",
  "спецоперац",
  "справедлив",
  "ссср",
  "старшин",
  "стрелков",
  "студент",
  "супермарк",
  "сша",
  "танк",
  "теракт",
  "террор",
  "техникум",
  "топлив",
  "трагед",
  "транзит",
  "траур",
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
  "фронт",
  "фсб",
  "фсин",
  "хакер",
  "херсон",
  "хлопки",
  "хлопков",
  "хлопок",
  "ценов",
  "цены",
  "церемон",
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
