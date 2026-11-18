import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";

/** Reads an on-disk epub into memory for zip parsing (metadata only). */
export async function readEpubFileBytes(absolutePath: string): Promise<Uint8Array> {
  const base64 = await readAsStringAsync(absolutePath, {
    encoding: EncodingType.Base64,
  });

  return base64ToUint8Array(base64);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}