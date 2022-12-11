import { generateUncategorisedUrlPathSegment } from "./generate-uncategorised-url-path-segment";

const testCases: Array<{
  url: string;
  result: string;
}> = [
  {
    url: "https://www.example.com",
    result: "~e3b0c442",
  },
  {
    url: "https://www.example.com/",
    result: "~8a5edab2",
  },
  {
    url: "https://www.example.com/hello",
    result: "hello~13a7bc88",
  },
  {
    url: "https://www.example.com/hello/world",
    result: "hello-world~40e3eff4",
  },
  {
    url: "https://www.example.com/hello/world/",
    result: "hello-world~8fd8c4f8",
  },
  {
    url: "https://www.example.com/hello/world/?utm_source=hello&utm_medium=world&utm_campaign=hello-world",
    result:
      "hello-world-utm-source-hello-and-utm-medium-world-and-utm-campaign-h...~2e1a19de",
  },
  {
    url: "https://www.example.com/hello/world/?utm_source=hello&utm_medium=world&utm_campaign=hello-world&very-long-variable-name=hello-world-42",
    result:
      "hello-world-utm-source-hello-and-utm-medium-world-and-utm-campaign-h...~218f0cd8",
  },
  {
    url: "https://www.example.com/hello/world/?utm_source=hello&utm_medium=world&utm_campaign=hello-world&very-long-variable-name=hello-world-42#random-hash",
    result:
      "hello-world-utm-source-hello-and-utm-medium-world-and-utm-campaign-h...~d3fccaff",
  },
];

describe("generateUncategorisedUrlSubdirPath()", () => {
  for (const { url, result } of testCases) {
    it(`Returns "${result}" for "${url}"`, () => {
      expect(generateUncategorisedUrlPathSegment(url)).toEqual(result);
    });
  }
});
