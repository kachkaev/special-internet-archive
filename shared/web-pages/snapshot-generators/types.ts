export type ObtainSnapshotTimes = (
  webPageUrl: string,
  aliasUrl?: string | undefined,
) => Promise<string[]>;

export interface SnapshotGenerator {
  aliasesSupported: boolean;
  name: string;
  obtainSnapshotTimes: ObtainSnapshotTimes;
}
