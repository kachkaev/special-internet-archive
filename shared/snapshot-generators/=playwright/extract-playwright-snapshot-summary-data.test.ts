import { parseNumberOfFollowers } from "./extract-playwright-snapshot-summary-data";

describe("parseNumberOfFollowers", () => {
  it.each`
    input        | expectedResult
    ${"42"}      | ${42}
    ${"42,424"}  | ${42_424}
    ${"42 424"}  | ${42_424}
    ${"42424"}   | ${42_424}
    ${"42K"}     | ${42_000}
    ${"42.1K"}   | ${42_100}
    ${"42К"}     | ${42_000}
    ${"42,1К"}   | ${42_100}
    ${"42M"}     | ${42_000_000}
    ${"42.42M"}  | ${42_420_000}
    ${"42М"}     | ${42_000_000}
    ${"42,42М"}  | ${42_420_000}
    ${undefined} | ${undefined}
  `(`returns "$expectedResult" for "$input"`, ({ input, expectedResult }) => {
    expect(parseNumberOfFollowers(input as string | undefined)).toEqual(
      expectedResult,
    );
  });
});
