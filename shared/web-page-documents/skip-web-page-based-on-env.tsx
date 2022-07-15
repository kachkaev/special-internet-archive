import * as envalid from "envalid";
import RegexParser from "regex-parser";

import { cleanEnv } from "../clean-env";
import { OperationResult } from "../operations";
import { checkContentMatch } from "../web-page-sources";
import { WebPageDocument } from "./types";

export const skipWebPageBasedOnEnv = async ({
  webPageDocument,
  webPageDirPath,
}: {
  webPageDocument: WebPageDocument;
  webPageDirPath: string;
}): Promise<OperationResult | undefined> => {
  const env = cleanEnv({
    FILTER_CONTENT: envalid.str({
      desc: "Regex to filter web page URLs",
      default: "",
    }),
    FILTER_URL: envalid.str({
      desc: "Regex to filter web page URLs",
      default: "",
    }),
  });

  const filterContentRegex = env.FILTER_CONTENT
    ? RegexParser(env.FILTER_CONTENT)
    : undefined;

  const filterUrlRegex = env.FILTER_URL
    ? RegexParser(env.FILTER_URL)
    : undefined;

  if (filterUrlRegex && !filterUrlRegex.test(webPageDocument.webPageUrl)) {
    return { status: "skipped", message: `does not match FILTER_URL` };
  }

  if (
    filterContentRegex &&
    !(await checkContentMatch({
      webPageDocument,
      webPageDirPath,
      contentRegex: filterContentRegex,
    }))
  ) {
    return { status: "skipped", message: `does not match FILTER_CONTENT` };
  }
};
