import { Asset } from "expo-asset";

import { getFixtureModuleId, type FixtureId } from "./fixtures";

/** Resolves a bundled fixture to a local `file://` epub the reader can extract. */
export async function resolveBundledEpub(fixtureId: FixtureId): Promise<string> {
  const asset = Asset.fromModule(getFixtureModuleId(fixtureId));
  await asset.downloadAsync();

  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error(`Could not resolve bundled epub for “${fixtureId}”.`);
  }

  return uri;
}