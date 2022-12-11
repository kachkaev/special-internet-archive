/**
 * Converts URL host to SURT format (Sort-friendly URI Reordering Transform)
 *
 * @example "www.example.com" -> "(com,example,www,)"
 * @param see http://crawler.archive.org/articles/user_manual/glossary.html#surt
 */
export const convertUrlHostToSurtFormat = (url: string): string => {
  const { host } = new URL(url);
  if (/:\d/.test(host)) {
    throw new Error(
      `Host ${host} contains a port number so SURT cannot be applied`,
    );
  }

  return `(${host.split(".").reverse().join(",")},)`;
};
