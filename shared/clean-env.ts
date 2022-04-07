import { config } from "dotenv-flow";
import * as envalid from "envalid";

import { UserFriendlyError } from "./user-friendly-error";

export const customEnvalidReporter: typeof envalid.defaultReporter = (
  errors,
) => {
  const outputChunks: string[] = [];
  envalid.defaultReporter(errors, {
    logger: (message) => {
      outputChunks.push(message);
    },
    onError: () => {
      throw new UserFriendlyError(outputChunks.join("\n"));
    },
  });
};

export const cleanEnv = <T>(specs: {
  [K in keyof T]: envalid.ValidatorSpec<T[K]>;
}) => {
  config({ silent: true });

  return envalid.cleanEnv(process.env, specs, {
    reporter: customEnvalidReporter,
  });
};
