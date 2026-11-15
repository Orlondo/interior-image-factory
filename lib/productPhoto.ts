import http from "node:http";
import https from "node:https";
import { checkPublicUrl } from "./productPage";

/**
 * Downloads a product's picture so the image generator can be shown the real item. Only public addresses
 * are opened (every redirect is checked too), only real PNG, JPEG or WebP pictures are kept, and a picture
 * that is too large or cannot be read is skipped: the image is then made from words, as before.
 */

export type ProductPhoto = { b64: string; mime: "image/png" | "image/jpeg" | "image/webp"; extension: "png" | "jpg" | "webp" };

export const MAX_PHOTO_BYTES = 4_000_000;
const MAX_REDIRECTS = 5;

const PHOTO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "identity",
  Connection: "close",
};

/** What kind of picture these bytes are, from their first bytes (never from what the server claims). */
export function sniffImage(bytes: Buffer): Pick<ProductPhoto, "mime" | "extension"> | null {
  if (bytes.length > 12 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", extension: "png" };
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.length > 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
}

async function getBytes(
  raw: string,
  check: (url: string) => Promise<URL>,
  redirects: number
): Promise<{ status: number; body: Buffer } | null> {
  const url = await check(raw);
  const client = url.protocol === "https:" ? https : http;

  const result = await new Promise<{ status: number; body: Buffer; location: string }>((resolve, reject) => {
    const request = client.request(url, { method: "GET", headers: { Host: url.host, ...PHOTO_HEADERS }, timeout: 12000 }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_PHOTO_BYTES) {
          request.destroy(new Error("TOO_LARGE"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () =>
        resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks), location: String(response.headers.location ?? "") })
      );
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("TIMEOUT")));
    request.on("error", reject);
    request.end();
  });

  if (result.status >= 300 && result.status < 400 && result.location) {
    if (redirects <= 0) return null;

    return getBytes(new URL(result.location, url).toString(), check, redirects - 1);
  }

  return { status: result.status, body: result.body };
}

/** The product's picture, or null when it cannot be had safely (the caller then uses words only). */
export async function fetchProductPhoto(
  address: string,
  check: (url: string) => Promise<URL> = checkPublicUrl
): Promise<ProductPhoto | null> {
  if (!/^https?:\/\//i.test(address)) return null;

  try {
    const got = await getBytes(address, check, MAX_REDIRECTS);
    if (!got || got.status < 200 || got.status >= 300) return null;
    const kind = sniffImage(got.body);
    if (!kind) return null;

    return { ...kind, b64: got.body.toString("base64") };
  } catch {
    return null;
  }
}

/** Downloads each distinct address once, in parallel. Addresses that fail are left out of the result. */
export async function fetchProductPhotos(
  addresses: readonly string[],
  fetcher: (address: string) => Promise<ProductPhoto | null> = fetchProductPhoto
): Promise<Map<string, ProductPhoto>> {
  const distinct = [...new Set(addresses.filter(Boolean))];
  const got = await Promise.all(distinct.map(async (address) => [address, await fetcher(address)] as const));

  return new Map(got.flatMap(([address, photo]) => (photo ? [[address, photo] as const] : [])));
}
