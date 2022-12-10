import { throwExitCodeErrorIfOperationFailed } from "../../shared/errors";
import { processWebPages } from "../../shared/web-page-documents";
import { skipWebPageBasedOnEnv } from "../../shared/web-page-documents/skip-web-page-based-on-env";
import { extractRelevantWebPageUrls } from "../../shared/web-page-sources";
import { generateAutoPopulateUrlInbox } from "./shared/generate-auto-populate-url-inbox";

const script = generateAutoPopulateUrlInbox({
  contentsLabel: "relevant URLs",
  listWebPageUrls: async ({ output }) => {
    const relevantWebPageUrlSet = new Set<string>();

    const operationResult = await processWebPages({
      output,
      processWebPage: async ({ webPageDirPath, webPageDocument }) => {
        const earlyResult = await skipWebPageBasedOnEnv({
          webPageDirPath,
          webPageDocument,
        });

        if (earlyResult) {
          return earlyResult;
        }

        const relevantWebPageUrls = await extractRelevantWebPageUrls({
          webPageDirPath,
          webPageDocument,
        });

        for (const relevantWebPageUrl of relevantWebPageUrls) {
          relevantWebPageUrlSet.add(relevantWebPageUrl);
        }

        return {
          status: relevantWebPageUrls.length > 0 ? "processed" : "skipped",
          message: `relevant web page URLs: ${relevantWebPageUrls.length}`,
        };
      },
    });

    throwExitCodeErrorIfOperationFailed(operationResult);

    return [...relevantWebPageUrlSet.values()];
  },
});

await script();
