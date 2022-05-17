import { DateObjectUnits, DateTime, DurationLike } from "luxon";

import { parseRawVkTime } from "./parse-raw-vk-time";

const nbsp = String.fromCodePoint(160); // Found in some dates like "20 июл 2020"

const formatMoscowTime = ({
  minus,
  set,
}: {
  minus?: DurationLike;
  set?: DateObjectUnits;
}) =>
  DateTime.local({ zone: "Europe/Moscow" })
    .minus(minus ?? {})
    .set({
      second: 0,
      millisecond: 0,
      ...set,
    })
    .setZone("utc")
    .toISO({ suppressMilliseconds: true });

describe("parseRawVkTime", () => {
  it.each`
    input                                 | expectedResult
    ${"только что"}                       | ${formatMoscowTime({})}
    ${"42 секунды назад"}                 | ${formatMoscowTime({})}
    ${"минуту назад"}                     | ${formatMoscowTime({ minus: { minute: 1 } })}
    ${"две минуты назад"}                 | ${formatMoscowTime({ minus: { minute: 2 } })}
    ${"три минуты назад"}                 | ${formatMoscowTime({ minus: { minute: 3 } })}
    ${"4 минуты назад"}                   | ${formatMoscowTime({ minus: { minute: 4 } })}
    ${"10 минут назад"}                   | ${formatMoscowTime({ minus: { minute: 10 } })}
    ${"42 минуты назад"}                  | ${formatMoscowTime({ minus: { minute: 42 } })}
    ${"час назад"}                        | ${formatMoscowTime({ minus: { hour: 1 } })}
    ${"три часа назад"}                   | ${formatMoscowTime({ minus: { hour: 3 } })}
    ${"10 часов назад"}                   | ${formatMoscowTime({ minus: { hour: 10 } })}
    ${"сегодня в 13:42"}                  | ${formatMoscowTime({ set: { hour: 13, minute: 42 } })}
    ${"вчера в 10:15"}                    | ${formatMoscowTime({ minus: { day: 1 }, set: { hour: 10, minute: 15 } })}
    ${"10 фев в 0:15"}                    | ${formatMoscowTime({ set: { month: 2, day: 10, hour: 0, minute: 15 } })}
    ${"10 фев в 00:15"}                   | ${formatMoscowTime({ set: { month: 2, day: 10, hour: 0, minute: 15 } })}
    ${`10${nbsp}фев${nbsp}в${nbsp}00:15`} | ${formatMoscowTime({ set: { month: 2, day: 10, hour: 0, minute: 15 } })}
    ${"10 фев 2020 в 20:30"}              | ${formatMoscowTime({ set: { year: 2020, month: 2, day: 10, hour: 20, minute: 30 } })}
    ${`20${nbsp}июл${nbsp}2021`}          | ${formatMoscowTime({ set: { year: 2021, month: 7, day: 20, hour: 23, minute: 59, second: 59 } })}
    ${"10 фев 2020"}                      | ${formatMoscowTime({ set: { year: 2020, month: 2, day: 10, hour: 23, minute: 59, second: 59 } })}
    ${"10 июн в 20:15"}                   | ${formatMoscowTime({ set: { month: 6, day: 10, hour: 20, minute: 15 } })}
    ${`10${nbsp}июн${nbsp}в${nbsp}20:15`} | ${formatMoscowTime({ set: { month: 6, day: 10, hour: 20, minute: 15 } })}
    ${"10 июн 2018 в 9:30"}               | ${formatMoscowTime({ set: { year: 2018, month: 6, day: 10, hour: 9, minute: 30 } })}
    ${"10 июн 2018"}                      | ${formatMoscowTime({ set: { year: 2018, month: 6, day: 10, hour: 23, minute: 59, second: 59 } })}
  `(`returns "$expectedResult" for "$input"`, ({ input, expectedResult }) => {
    expect(parseRawVkTime(input as string)).toEqual(expectedResult);
  });

  it.each(["", "??", "10 февраля в 10:15", "10 февраля"])(
    'throws for "%s"',
    (input) => {
      expect(() => parseRawVkTime(input)).toThrow(
        `Unexpected VK time format "${input}"`,
      );
    },
  );
});
