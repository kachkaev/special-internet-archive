import * as envalid from "envalid";

import { cleanEnv } from "./clean-env";

const env = cleanEnv({
  EXPERIMENTAL_UNCATEGORIZED_VK_PAGES: envalid.bool({
    desc: "Support non-canonical URLs for VK",
    default: false,
  }),
  EXPERIMENTAL_GENERIC_URLS: envalid.bool({
    desc: "Support any http / https URLs",
    default: false,
  }),
});

export const uncategorizedVkPagesAreEnabled =
  env.EXPERIMENTAL_UNCATEGORIZED_VK_PAGES;

export const genericUrlsAreEnabled = env.EXPERIMENTAL_UNCATEGORIZED_VK_PAGES;
