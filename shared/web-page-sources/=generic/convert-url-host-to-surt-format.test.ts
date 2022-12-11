import { convertUrlHostToSurtFormat } from "./convert-url-host-to-surt-format";

const testCases: Array<{
  url: string;
  result?: string;
}> = [
  {
    url: "https://www.example.com",
    result: "(com,example,www,)",
  },
  {
    url: "https://www.example.com/42",
    result: "(com,example,www,)",
  },
  {
    url: "https://www.example.com:4242",
  },
];

describe("convertUrlHostToSurtFormat()", () => {
  for (const { url, result } of testCases) {
    if (result) {
      it(`Returns "${result}" for "${url}"`, () => {
        expect(convertUrlHostToSurtFormat(url)).toEqual(result);
      });
    } else {
      it(`Throws for ${url}`, () => {
        expect(() => convertUrlHostToSurtFormat(url)).toThrow();
      });
    }
  }
});
