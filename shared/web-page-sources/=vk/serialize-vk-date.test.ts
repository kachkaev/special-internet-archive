import { DateTime } from "luxon";

import { unserializeTime } from "../../time";
import { serializeVkDate } from "./serialize-vk-date";

const currentYear = DateTime.utc().year;

describe("serializeVkDate", () => {
  it.each`
    input                                                | expectedResult
    ${unserializeTime(`${currentYear}-08-01T12:00:00Z`)} | ${"1 авг"}
    ${unserializeTime(`${currentYear}-01-15T12:00:00Z`)} | ${"15 янв"}
    ${unserializeTime(`2021-03-31T12:00:00Z`)}           | ${"31 мар 2021"}
    ${unserializeTime(`2020-01-31T23:00:00Z`)}           | ${"1 фев 2020"}
  `(`returns "$expectedResult" for "$input"`, ({ input, expectedResult }) => {
    expect(serializeVkDate(input as DateTime)).toEqual(expectedResult);
  });
});
