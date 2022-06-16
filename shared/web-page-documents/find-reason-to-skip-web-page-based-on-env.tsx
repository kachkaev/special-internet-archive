import * as envalid from "envalid";
import RegexParser from "regex-parser";

import { cleanEnv } from "../clean-env";
import { checkContentMatch } from "../web-page-sources";
import { FindReasonToSkipWebPage } from "./types";

export const findReasonToSkipWebPageBasedOnEnv: FindReasonToSkipWebPage =
  async ({ webPageDocument, webPageDirPath }) => {
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
      return `does not match FILTER_URL`;
    }

    if (
      filterContentRegex &&
      !(await checkContentMatch({
        webPageDocument,
        webPageDirPath,
        contentRegex: filterContentRegex,
      }))
    ) {
      return `does not match FILTER_CONTENT`;
    }
  };
