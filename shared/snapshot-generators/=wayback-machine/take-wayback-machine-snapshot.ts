import { TakeSnapshot } from "../types";
import { createAxiosInstanceForWaybackMachine } from "./shared/create-axios-instance-for-wayback-machine";

const axiosInstance = createAxiosInstanceForWaybackMachine();

/**
 * Inspired by https://github.com/tgbot-collection/archiver/blob/e5996b5944fa33244a75dce883b5c80e9e92d50e/archiveOrg.go#L30-L38
 */
export const takeWaybackMachineSnapshot: TakeSnapshot = async ({
  webPageUrl,
}) => {
  const formData = new URLSearchParams({
    url: webPageUrl,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party API
    capture_all: "on",
  }).toString();

  const res = await axiosInstance.post<string>(
    `https://web.archive.org/save/`,
    formData,
    { responseType: "text" },
  );

  const html = res.data;
  const watchJobId = html.match(/spn\.watchJob\("([\w-]+)"/)?.[1];

  if (!watchJobId) {
    throw new Error("Could not find watchJob id in Wayback Machine response");
  }

  return `Status: https://web.archive.org/save/status/${watchJobId}`;
};
