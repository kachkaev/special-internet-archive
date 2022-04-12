import { DateTime, DurationLike, Interval } from "luxon";

export const serializeTime = (time?: string | DateTime): string => {
  let dateTime: DateTime | undefined =
    time instanceof DateTime ? time : undefined;

  if (typeof time === "string") {
    // YYYYMMDDHHMMSS
    if (time.length === 14) {
      dateTime = DateTime.fromFormat(time, "yyyyMMddHHmmss").setZone("utc");
    } else {
      dateTime = DateTime.fromRFC2822(time).setZone("utc");
      if (!dateTime.isValid) {
        dateTime = DateTime.fromISO(time, { setZone: true }).setZone("utc");
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
    DateTime.now(),
    DateTime.fromISO(serializeTime(time), { setZone: true }),
  ).length("days");
