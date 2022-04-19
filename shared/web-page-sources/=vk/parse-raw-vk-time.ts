import { DateTime } from "luxon";

const monthLookup: Record<string, number> = {
  янв: 1,
  фев: 2,
  мар: 3,
  апр: 4,
  мая: 5,
  июн: 6,
  июл: 7,
  авг: 8,
  сен: 9,
  окт: 10,
  ноя: 11,
  дек: 12,
};

const parseRawMonth = (rawMonth: string): number => monthLookup[rawMonth] ?? -1;

export const parseRawVkTime = (rawTime: string): string => {
  try {
    const baseDateTime = DateTime.local({ zone: "Europe/Moscow" });
    let resultTingDateTime: DateTime | undefined;

    {
      // сегодня в 13:42, вчера в 10:15
      const [, relativeDate, rawHour, rawMinute] =
        rawTime.match(/^(сегодня|вчера) в (\d+):(\d+)$/) ?? [];

      if (relativeDate && rawHour && rawMinute) {
        resultTingDateTime = baseDateTime
          .minus({ day: relativeDate === "сегодня" ? 0 : 1 })
          .set({
            hour: Number.parseInt(rawHour),
            minute: Number.parseInt(rawMinute),
            second: 0,
            millisecond: 0,
          });
      }
    }

    {
      // 10 фев в 0:15
      const [, rawDay, rawMonth, rawHour, rawMinute] =
        rawTime.match(/^(\d+) (\p{L}{3}) в (\d+):(\d+)$/u) ?? [];

      if (rawDay && rawMonth && rawHour && rawMinute) {
        resultTingDateTime = baseDateTime.set({
          month: parseRawMonth(rawMonth),
          day: Number.parseInt(rawDay),
          hour: Number.parseInt(rawHour),
          minute: Number.parseInt(rawMinute),
          second: 0,
          millisecond: 0,
        });
      }
    }

    {
      // 10 фев 2020 в 0:15
      const [, rawDay, rawMonth, rawYear, rawHour, rawMinute] =
        rawTime.match(/^(\d+) (\p{L}{3}) (\d{4}) в (\d+):(\d+)$/u) ?? [];

      if (rawDay && rawMonth && rawYear && rawHour && rawMinute) {
        resultTingDateTime = baseDateTime.set({
          year: Number.parseInt(rawYear),
          month: parseRawMonth(rawMonth),
          day: Number.parseInt(rawDay),
          hour: Number.parseInt(rawHour),
          minute: Number.parseInt(rawMinute),
          second: 0,
          millisecond: 0,
        });
      }
    }

    {
      // 10 фев 2020
      const [, rawDay, rawMonth, rawYear] =
        rawTime.match(/^(\d+) (\p{L}{3}) (\d{4})$/u) ?? [];

      if (rawDay && rawMonth && rawYear) {
        resultTingDateTime = baseDateTime.set({
          year: Number.parseInt(rawYear),
          month: parseRawMonth(rawMonth),
          day: Number.parseInt(rawDay),
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 0,
        });
      }
    }

    if (resultTingDateTime?.isValid) {
      return resultTingDateTime
        .setZone("utc")
        .toISO({ suppressMilliseconds: true });
    }
  } catch {
    // noop: throw after catch
  }
  throw new Error(`Unexpected VK time format "${rawTime}"`);
};
