import sleep from "sleep-promise";

import { TakeSnapshot } from "../types";

export const takePlaywrightSnapshot: TakeSnapshot = async () => {
  await sleep(100);
  throw new Error("Playwright snapshots are not implemented yet");
};
