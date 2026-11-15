import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { guessRooms } from "./products";

/**
 * Reads a product's name, price and picture from its shop page (schema.org JSON-LD first, then Open Graph
 * tags, then the page title). Whatever a page does not give comes back empty, so it can be typed in.
 * The price is a snapshot of that moment.
 */

export type PageProduct = { name: string; price: string; image: string };

const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$", JPY: "¥" };

function decode(textValue: string): string {
  return textValue
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function priceText(amount: unknown, currency: unknown): string {
  const number = Number(String(amount).replace(/,/g, ""));
  if (!Number.isFinite(number) || amount === "" || amount === null || amount === undefined) return "";
  const code = typeof currency === "string" ? currency.toUpperCase() : "";
  const body = Number.isInteger(number) ? number.toLocaleString("en-US") : number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `${SYMBOLS[code] ?? (code ? `${code} ` : "$")}${body}`;
}

function first(value: unknown): string {
  const item = Array.isArray(value) ? value[0] : value;
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>;
    return String(record.url ?? record["@id"] ?? "").trim();
  }

  return typeof item === "string" ? item.trim() : "";
}

function* nodes(value: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(value)) {
    for (const item of value) yield* nodes(item);
  } else if (typeof value === "object" && value !== null) {
    yield value as Record<string, unknown>;
    for (const inner of Object.values(value)) {
      if (typeof inner === "object" && inner !== null) yield* nodes(inner);
    }
  }
}

function meta(page: string, names: string[]): string {
  for (const name of names) {
    for (const tag of page.match(/<meta\b[^>]*>/gi) ?? []) {
      if (new RegExp(`(?:property|name|itemprop)\\s*=\\s*["']${name.replace(/[:.]/g, "\\$&")}["']`, "i").test(tag)) {
        const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
        if (content) return decode(content);
      }
    }
  }

  return "";
}

export function parseProductPage(page: string, baseUrl = ""): PageProduct {
  const found: PageProduct = { name: "", price: "", image: "" };

  for (const block of page.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(block[1] as string);
    } catch {
      continue;
    }
    for (const node of nodes(data)) {
      const kinds = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
      if (!kinds.includes("Product")) continue;
      found.name ||= first(node.name);
      found.image ||= first(node.image);
      for (const offer of nodes(node.offers ?? [])) {
        const amount = offer.price ?? offer.lowPrice;
        if (amount !== undefined && amount !== "" && !found.price) found.price = priceText(amount, offer.priceCurrency);
      }
    }
  }

  found.name ||= meta(page, ["og:title", "twitter:title"]);
  if (!found.name) found.name = decode((page.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim());
  found.image ||= meta(page, ["og:image", "og:image:secure_url", "twitter:image"]);
  if (!found.price) {
    const amount = meta(page, ["product:price:amount", "og:price:amount", "price"]);
    if (amount) found.price = priceText(amount, meta(page, ["product:price:currency", "og:price:currency", "priceCurrency"]));
  }
  if (found.image && baseUrl) {
    try {
      found.image = new URL(found.image, baseUrl).toString();
    } catch {
      found.image = "";
    }
  }
  found.name = decode(found.name).replace(/\s+/g, " ").trim().slice(0, 120);

  return found;
}

export class ProductPageError extends Error {}

function isPrivate(address: string): boolean {
  if (address.includes(":")) {
    const a = address.toLowerCase();
    return a === "::1" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80") || a.startsWith("::ffff:127.") || a === "::";
  }
  const [a, b] = address.split(".").map(Number) as [number, number];

  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a >= 224;
}

/** Only public http(s) addresses: never this computer or another one on the home network. */
export async function checkPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ProductPageError("Paste a full product link that starts with https://");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ProductPageError("Paste a full product link that starts with https://");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((entry) => entry.address);
  if (addresses.length === 0) throw new ProductPageError("That address could not be found. Check the link");
  if (addresses.some(isPrivate)) throw new ProductPageError("That link points to a private address, so it was not opened");

  return url;
}

export async function fetchProduct(raw: string): Promise<PageProduct & { link: string; rooms: string[] }> {
  const url = await checkPublicUrl(raw);
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", "Accept-Language": "en-US,en;q=0.9" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  }).catch(() => null);

  if (!response || !response.ok) {
    throw new ProductPageError(
      `The page could not be opened${response ? ` (${response.status})` : ""}. Some shops block automated visits; type the details in instead`
    );
  }
  const page = (await response.text()).slice(0, 2_000_000);
  const product = parseProductPage(page, response.url || url.toString());

  return { ...product, link: response.url || url.toString(), rooms: guessRooms(product.name) };
}
