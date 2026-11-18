/** Bundled epub fixtures for dev/smoke tests (ticket 001). */
export const FIXTURE_IDS = {
  smoke: "smoke",
} as const;

export type FixtureId = (typeof FIXTURE_IDS)[keyof typeof FIXTURE_IDS];

const FIXTURE_MODULES: Record<FixtureId, number> = {
  [FIXTURE_IDS.smoke]: require("../../../assets/fixtures/epubs/smoke.epub"),
};

export function isFixtureId(id: string): id is FixtureId {
  return id in FIXTURE_MODULES;
}

export function getFixtureModuleId(id: FixtureId): number {
  return FIXTURE_MODULES[id];
}