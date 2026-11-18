import { unzipSync } from "fflate";

export type EpubPackageMetadata = {
  title: string | null;
  author: string | null;
};

/** Title/author from package OPF; returns nulls when structure is missing. */
export function parsePackageMetadataFromEpubBytes(data: Uint8Array): EpubPackageMetadata {
  try {
    const archive = unzipSync(data);
    const containerXml = readArchiveText(archive, "META-INF/container.xml");
    if (!containerXml) {
      return { title: null, author: null };
    }

    const opfPath = opfPathFromContainer(containerXml);
    if (!opfPath) {
      return { title: null, author: null };
    }

    const opfXml = readArchiveText(archive, opfPath) ?? readArchiveText(archive, opfPath.replace(/^\//, ""));
    if (!opfXml) {
      return { title: null, author: null };
    }

    return {
      title: firstDcElement(opfXml, "title"),
      author: firstDcElement(opfXml, "creator") ?? firstDcElement(opfXml, "contributor"),
    };
  } catch {
    return { title: null, author: null };
  }
}

function readArchiveText(archive: Record<string, Uint8Array>, path: string): string | null {
  const entry = archive[path];
  if (!entry) {
    return null;
  }
  return new TextDecoder("utf-8").decode(entry);
}

function opfPathFromContainer(containerXml: string): string | null {
  const match = containerXml.match(/full-path=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function firstDcElement(opfXml: string, localName: string): string | null {
  const pattern = new RegExp(
    `<(?:\\w+:)?${localName}[^>]*>([^<]+)</(?:\\w+:)?${localName}>`,
    "i",
  );
  const match = opfXml.match(pattern);
  const raw = match?.[1]?.trim();
  return raw && raw.length > 0 ? decodeXmlEntities(raw) : null;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}