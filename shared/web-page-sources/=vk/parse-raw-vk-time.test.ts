import { DateObjectUnits, DateTime, DurationLike } from "luxon";

import { parseRawVkTime } from "./parse-raw-vk-time";

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
    input                    | expectedResult
    ${"сегодня в 13:42"}     | ${formatMoscowTime({ set: { hour: 13, minute: 42 } })}
    ${"вчера в 10:15"}       | ${formatMoscowTime({ minus: { day: 1 }, set: { hour: 10, minute: 15 } })}
    ${"10 фев в 0:15"}       | ${formatMoscowTime({ set: { month: 2, day: 10, hour: 0, minute: 15 } })}
    ${"10 фев в 00:15"}      | ${formatMoscowTime({ set: { month: 2, day: 10, hour: 0, minute: 15 } })}
    ${"10 фев 2020 в 20:30"} | ${formatMoscowTime({ set: { year: 2020, month: 2, day: 10, hour: 20, minute: 30 } })}
    ${"10 фев 2020"}         | ${formatMoscowTime({ set: { year: 2020, month: 2, day: 10, hour: 23, minute: 59, second: 59 } })}
    ${"10 июн в 20:15"}      | ${formatMoscowTime({ set: { month: 6, day: 10, hour: 20, minute: 15 } })}
    ${"10 июн 2018 в 9:30"}  | ${formatMoscowTime({ set: { year: 2018, month: 6, day: 10, hour: 9, minute: 30 } })}
    ${"10 июн 2018"}         | ${formatMoscowTime({ set: { year: 2018, month: 6, day: 10, hour: 23, minute: 59, second: 59 } })}
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
