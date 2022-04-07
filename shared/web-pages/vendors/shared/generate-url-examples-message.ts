export const generateUrlExamplesMessage = (urlExamples: string[]): string =>
  `Please follow these examples:\n- ${urlExamples.join("\n- ")}`;
