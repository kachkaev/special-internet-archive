import { createHash } from "node:crypto";

import slugify from "@sindresorhus/slugify";

const maxLength = 80;
const hashSuffixLength = 8;

export const generateUncategorisedUrlPathSegment = (url: string): string => {
  const parsedUrl = new URL(url);
  const urlWithoutOrigin = url.slice(parsedUrl.origin.length);

  const hash = createHash("sha256")
    .update(urlWithoutOrigin)
    .digest("hex")
    .slice(0, hashSuffixLength);

  const slug = slugify(urlWithoutOrigin);
  const normalizedSlug =
    slug.length > maxLength - hashSuffixLength - 1
      ? `${slug.slice(0, maxLength - hashSuffixLength - 1 - 3)}...`
      : slug;

  return `${normalizedSlug}~${hash.slice(0, 8)}`;
};
