import { checkIfTextIsRelevant } from "./check-if-text-is-relevant";

const testCases = [
  {
    relevant: true,
    text: `Почём сахарок для народа?`,
  },
  {
    relevant: false,
    text: `озверели совсем`,
  },
  {
    relevant: true,
    text: `оzверели совсем`,
  },
  {
    relevant: true,
    text: `озvерели совсем`,
  },
  {
    relevant: false,
    text: "Мой твиттер: @azaza. Подписывайтесь!",
  },
  {
    relevant: false,
    text: "Почта: v@example.com. Пишите!",
  },
  {
    relevant: false,
    text: "ВК: https://vk.com/azaza. Вступайте!",
  },
  {
    relevant: false,
    text: "Сайт: v.example.com Заходите!",
  },
  {
    relevant: false,
    text: "Сайт: example.com/сахар Заходите!",
  },
  {
    relevant: false,
    text: ` Привет мир!
            Twitter : @azaza
            Е-mail : v@example.com
            Вконтакте: https://vk.com/azaza
            Сайт: v.example.com`,
  },
  {
    relevant: false,
    text: ` Привет мир!
            Twitter : @azaza
            Е-mail : v@example.com
            Вконтакте: https://vk.com/azaza
            Сайт: v.example.com
            
            И ещё разок:
            Twitter : @azaza
            Е-mail : v@example.com
            Вконтакте: https://vk.com/azaza
            Сайт: v.example.com`,
  },
  {
    relevant: false,
    text: ` 💞Господа!💞
            Как насчёт вкусняшек к чаю?!)🍒🥞
            Мы печём вкуснейшие и необычные торты!
            Выбирайте и заказывайте, а мы доставим...🍰🍇
            https://кусайка.рф/torti-na-zakaz-v-pskove/`,
  },
];

const shortenText = (text: string, cap: number) => {
  if (text.length < cap) {
    return text;
  }

  return `${text.slice(0, cap - 3)}...`;
};

describe("checkIfTextIsRelevant()", () => {
  for (const { relevant, text } of testCases) {
    it(`Returns ${String(relevant)} for "${shortenText(text, 20)}"`, () => {
      expect(checkIfTextIsRelevant(text)).toBe(relevant);
    });
  }
});
