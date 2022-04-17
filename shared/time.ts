import { DateTime, DateTimeOptions, DurationLike, Interval } from "luxon";

export const serializeTime = (time?: string | DateTime): string => {
  let dateTime: DateTime | undefined =
    time instanceof DateTime ? time : undefined;

  if (typeof time === "string") {
    const options: DateTimeOptions = { setZone: true, zone: "utc" };
    // YYYYMMDDHHMMSS
    if (time.length === 14) {
      dateTime = DateTime.fromFormat(time, "yyyyMMddHHmmss", options);
    } else {
      dateTime = DateTime.fromRFC2822(time, options);
      if (!dateTime.isValid) {
        dateTime = DateTime.fromISO(time, options);
      }
    }
  }

  return (dateTime ?? DateTime.utc())
    .set({ millisecond: 0 })
    .toISO({ suppressMilliseconds: true });
};

export const isTimeOlderThan = (
  time: string | DateTime,
  duration: DurationLike,
): boolean =>
  DateTime.fromISO(serializeTime(time), { setZone: true }).plus(duration) <
  DateTime.utc();

export const calculateDaysSince = (time: string | DateTime): number =>
  Interval.fromDateTimes(
    DateTime.fromISO(serializeTime(time), { setZone: true }),
    DateTime.utc(),
  ).length("days");
