import { DateTime } from "luxon";

const currentYear = DateTime.utc().year;

const monthLookup: Record<number, string> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  1: "янв",
  2: "фев",
  3: "мар",
  4: "апр",
  5: "мая",
  6: "июн",
  7: "июл",
  8: "авг",
  9: "сен",
  10: "окт",
  11: "ноя",
  12: "дек",
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const serializeVkDate = (dateTime: DateTime): string => {
  const chunks: string[] = [];
  const moscowDateTime = dateTime.setZone("Europe/Moscow"); // Used in VK SSR
  chunks.push(`${moscowDateTime.day}`, monthLookup[moscowDateTime.month]!);

  if (moscowDateTime.year !== currentYear) {
    chunks.push(`${moscowDateTime.year}`);
  }

  return chunks.join(" ");
};
