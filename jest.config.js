/** @type {import("jest").Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  preset: "ts-jest/presets/js-with-babel-esm",
  // @todo Remove when https://github.com/facebook/jest/pull/13705 is released
  moduleNameMapper: {
    /* eslint-disable @typescript-eslint/naming-convention */
    "#ansi-styles": "ansi-styles/index.js",
    "#supports-color": "supports-color/index.js",
    /* eslint-enable @typescript-eslint/naming-convention */
  },
};
