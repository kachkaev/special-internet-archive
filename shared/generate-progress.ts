export const generateProgress = (
  index: number,
  total: number,
): { progress: string; progressPrefix: string } => {
  const totalLength = `${total}`.length;

  const progress = `${`${index + 1}`.padStart(totalLength)} / ${total} `;
  const progressPrefix = " ".repeat(progress.length);

  return { progress, progressPrefix };
};
