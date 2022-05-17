import { DateTime } from "luxon";

import { unserializeTime } from "../../time";

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

const wordToNumber: Record<string, number> = {
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
};

const parseRawMonth = (rawMonth: string): number => monthLookup[rawMonth] ?? -1;

const doParseRawVkTime = (
  rawTime: string,
  baseDateTimeRoundedToMinute: DateTime,
): DateTime | undefined => {
  if (rawTime === "только что" || rawTime.includes("секунд")) {
    return baseDateTimeRoundedToMinute;
  }
  if (rawTime === "минуту назад") {
    return baseDateTimeRoundedToMinute.minus({ minute: 1 });
  }
  if (rawTime === "час назад") {
    return baseDateTimeRoundedToMinute.minus({ hour: 1 });
  }

  {
    const [firstWord, ...rest] = rawTime.split(/\s/);
    if (firstWord) {
      const rawTimeWithNumber = [
        wordToNumber[firstWord] ?? firstWord,
        ...rest,
      ].join(" ");
      const [, rawCount, unit] =
        rawTimeWithNumber.match(/^(\d+)\s(минут|час)(\p{L}*)\sназад$/u) ?? [];
      if (rawCount && unit) {
        return baseDateTimeRoundedToMinute.minus({
          [unit === "час" ? "hour" : "minute"]: Number.parseInt(rawCount),
        });
      }
    }
  }

  {
    // сегодня в 13:42, вчера в 10:15
    const [, relativeDate, rawHour, rawMinute] =
      rawTime.match(/^(сегодня|вчера)\sв\s(\d+):(\d+)$/) ?? [];

    if (relativeDate && rawHour && rawMinute) {
      return baseDateTimeRoundedToMinute
        .minus({ day: relativeDate === "сегодня" ? 0 : 1 })
        .set({
          hour: Number.parseInt(rawHour),
          minute: Number.parseInt(rawMinute),
        });
    }
  }

  {
    // 10 фев в 0:15
    const [, rawDay, rawMonth, rawHour, rawMinute] =
      rawTime.match(/^(\d+)\s(\p{L}{3})\sв\s(\d+):(\d+)$/u) ?? [];

    if (rawDay && rawMonth && rawHour && rawMinute) {
      return baseDateTimeRoundedToMinute.set({
        month: parseRawMonth(rawMonth),
        day: Number.parseInt(rawDay),
        hour: Number.parseInt(rawHour),
        minute: Number.parseInt(rawMinute),
      });
    }
  }

  {
    // 10 фев 2020 в 0:15
    const [, rawDay, rawMonth, rawYear, rawHour, rawMinute] =
      rawTime.match(/^(\d+)\s(\p{L}{3})\s(\d{4})\sв\s(\d+):(\d+)$/u) ?? [];

    if (rawDay && rawMonth && rawYear && rawHour && rawMinute) {
      return baseDateTimeRoundedToMinute.set({
        year: Number.parseInt(rawYear),
        month: parseRawMonth(rawMonth),
        day: Number.parseInt(rawDay),
        hour: Number.parseInt(rawHour),
        minute: Number.parseInt(rawMinute),
      });
    }
  }

  {
    // 10 фев 2020
    const [, rawDay, rawMonth, rawYear] =
      rawTime.match(/^(\d+)\s(\p{L}{3})\s(\d{4})$/u) ?? [];

    if (rawDay && rawMonth && rawYear) {
      return baseDateTimeRoundedToMinute.set({
        year: Number.parseInt(rawYear),
        month: parseRawMonth(rawMonth),
        day: Number.parseInt(rawDay),
        hour: 23,
        minute: 59,
        second: 59,
      });
    }
  }
};

export const parseRawVkTime = (rawTime: string, now?: string): string => {
  try {
    const baseDateTime = now
      ? unserializeTime(now).setZone("Europe/Moscow")
      : DateTime.local({ zone: "Europe/Moscow" });

    const resultingDateTime = doParseRawVkTime(
      rawTime,
      baseDateTime.set({ second: 0, millisecond: 0 }),
    );

    if (resultingDateTime?.isValid) {
      return resultingDateTime
        .setZone("utc")
        .toISO({ suppressMilliseconds: true });
    }
  } catch {
    // noop: throw after catch
  }
  throw new Error(`Unexpected VK time format "${rawTime}"`);
};
