import { DateTime, DateTimeOptions, DurationLike, Interval } from "luxon";

export const unserializeTime = (time: string): DateTime => {
  let dateTime: DateTime | undefined;

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

  if (!dateTime.isValid) {
    throw new Error(`Unable to parse ${time}`);
  }

  return dateTime.set({ millisecond: 0 });
};

export const serializeTime = (time?: string | DateTime): string => {
  const dateTime =
    time instanceof DateTime
      ? time
      : typeof time === "string"
      ? unserializeTime(time)
      : undefined;

  return (dateTime ?? DateTime.utc())
    .set({ millisecond: 0 })
    .toISO({ suppressMilliseconds: true });
};

export const normalizeStringifiedTime = (time: string): string => {
  return serializeTime(unserializeTime(time));
};

export const isTimeOlderThan = (
  time: string | DateTime,
  duration: DurationLike,
): boolean =>
  (time instanceof DateTime ? time : unserializeTime(time)).plus(duration) <
  DateTime.utc();

export const calculateDaysSince = (time: string | DateTime): number =>
  Interval.fromDateTimes(
    time instanceof DateTime ? time : unserializeTime(time),
    DateTime.utc(),
  ).length("days");

export const calculateDaysBetween = (
  timeMin: string | DateTime,
  timeMax: string | DateTime,
): number =>
  Interval.fromDateTimes(
    timeMin instanceof DateTime ? timeMin : unserializeTime(timeMin),
    timeMax instanceof DateTime ? timeMax : unserializeTime(timeMax),
  ).length("days");
