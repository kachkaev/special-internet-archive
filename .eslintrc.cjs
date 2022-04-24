module.exports = {
  extends: [
    "@kachkaev/eslint-config-react",
    "@kachkaev/eslint-config-react/extra-type-checking",
    "plugin:@next/next/recommended",
  ],
  overrides: [
    {
      files: ["**/scripts/**/shared/**"],
      rules: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- third-party limitation
        "no-restricted-syntax": require("@kachkaev/eslint-config-base").rules[
          "no-restricted-syntax"
        ],
      },
    },
  ],
};
