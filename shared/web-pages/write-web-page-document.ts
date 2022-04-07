import { writeFormattedJson } from "../helpers-for-json";
import { generateWebPageFilePath } from "./path-helpers";
import { WebPageDocument } from "./types";

export const writeWebPageDocument = async (
  payload: WebPageDocument,
): Promise<void> => {
  await writeFormattedJson(generateWebPageFilePath(payload.url), payload);
};
