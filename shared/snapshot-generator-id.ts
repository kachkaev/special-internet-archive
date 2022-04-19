/**
 * This type is extracted into a separate ‘library’ so that it can be used
 * inside page source logic. Importing from snapshot-generators would result
 * in circular dependencies.
 */
export type SnapshotGeneratorId = "playwright" | "waybackMachine";
