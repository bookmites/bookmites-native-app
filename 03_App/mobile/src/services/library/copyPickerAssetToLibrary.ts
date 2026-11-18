import { copyAsync } from "expo-file-system/legacy";

export async function copyPickerAssetToLibrary(
  sourceUri: string,
  destinationAbsolutePath: string,
): Promise<void> {
  await copyAsync({ from: sourceUri, to: destinationAbsolutePath });
}