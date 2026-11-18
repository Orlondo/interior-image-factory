import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { guessRooms } from "./products";

/**
 * Reads a product's name, price and picture from its shop page (schema.org JSON-LD first, then Open Graph
 * tags, then the page title). Whatever a page does not give comes back empty, so it can be typed in.
 * The price is a snapshot of that moment.
 */

/** `brand` is the company that makes the product; `store` is the shop the page belongs to. */
export type PageProduct = { name: string; price: string; image: string; brand: string; store: string };

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

/** The page's text with tags turned into "|" separators (scripts and styles dropped): "Brand | Possini Euro Design". */
function visibleText(page: string): string {
  const body = page
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, "|");

  return decode(body).replace(/[ \t\r\n\u00a0]+/g, " ").replace(/(\s*\|\s*)+/g, " | ");
}

function brandName(value: unknown): string {
  const item = Array.isArray(value) ? value[0] : value;
  const name = typeof item === "object" && item !== null ? (item as Record<string, unknown>).name : item;

  return typeof name === "string" ? decode(name).replace(/\s+/g, " ").trim().slice(0, 40) : "";
}

/** The shop's name: the page's own site name, else the web address's main word (www.arhaus.com -> Arhaus). */
function siteName(page: string, baseUrl: string): string {
  const named = meta(page, ["og:site_name"]);
  if (named) return (named.split(/\s+[-–|]\s+/)[0] ?? named).slice(0, 40);
  try {
    const parts = new URL(baseUrl).hostname.toLowerCase().split(".").filter((part) => part && part !== "www");
    const word = parts.length >= 2 ? (parts[parts.length - 2] as string) : "";

    return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
  } catch {
    return "";
  }
}

export function parseProductPage(page: string, baseUrl = ""): PageProduct {
  const found: PageProduct = { name: "", price: "", image: "", brand: "", store: "" };

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
      found.brand ||= brandName(node.brand) || brandName(node.manufacturer);
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
  found.brand ||= brandName(meta(page, ["product:brand", "og:brand", "brand"]));
  let text = "";
  if (!found.price) {
    // Some shops put the price only in the visible page ("Price: $499.99"), or in a tag marked as the price.
    const tag = page.match(/<[^>]+\b(?:itemprop\s*=\s*["']price["']|data-price)[^>]*>/i)?.[0];
    let amount = tag?.match(/(?:content|data-price)\s*=\s*["']\s*\$?([\d,]+(?:\.\d{1,2})?)\s*["']/i)?.[1];
    if (!amount) {
      text = visibleText(page);
      amount = text.match(/\bPrice\s*:?\s*(?:\|\s*)?\$\s*([\d,]+(?:\.\d{1,2})?)/i)?.[1];
    }
    if (amount) found.price = priceText(amount, "");
  }
  if (!found.brand) {
    text ||= visibleText(page);
    found.brand = brandName(text.match(/\bBrand\s*(?::|\|)\s*(?:\|\s*)?([^|]{2,40}?)\s*(?:\||$)/)?.[1]);
  }
  found.store = siteName(page, baseUrl);
  if (found.image && baseUrl) {
    try {
      found.image = new URL(found.image, baseUrl).toString();
    } catch {
      found.image = "";
    }
  }
  found.image = decode(found.image).replace(/;+$/, "");
  found.name = decode(found.name).replace(/\s+/g, " ").trim().slice(0, 120);

  return found;
}

export class ProductPageError extends Error {}

/** A shop's holding page ("Site Maintenance", "Access Denied", "Just a moment…"): its title is not the product's name. */
const HOLDING_PAGE = /^\s*(site maintenance|under maintenance|down for maintenance|we'?ll be right back|access denied|just a moment|attention required|service unavailable|temporarily unavailable|page not found|404\b|403\b|error\b)/i;

/** A shop's "are you a person?" check (Akamai, Cloudflare and the like): it sends a small script page instead of the product. */
const BOT_CHECK = /sec-if-cpt-container|protected by akamai|_Incapsula_Resource|challenge-platform|cf-browser-verification|px-captcha|captcha-delivery\.com|datadome/i;

export function isBotCheck(body: string): boolean {
  return body.length < 30000 && BOT_CHECK.test(body);
}

export function isHoldingPage(product: Pick<PageProduct, "name" | "price">): boolean {
  return HOLDING_PAGE.test(product.name) && !product.price;
}

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

/** What the video app's reader sends, and nothing more: some shops (Shopify ones answer 430) turn away requests with extra browser-only headers or Node's defaults. */
const READER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "identity",
  Connection: "close",
};

const MAX_PAGE = 2_000_000;
const MAX_REDIRECTS = 5;

export type PageResult = { status: number; body: string; url: string };

/**
 * Gets a page with `node:http(s)` directly (not `fetch`), following redirects by hand and checking every
 * address on the way. `check` decides which addresses may be opened.
 */
export async function getPage(
  raw: string,
  check: (url: string) => Promise<URL> = checkPublicUrl,
  redirects = MAX_REDIRECTS
): Promise<PageResult> {
  const url = await check(raw);
  const client = url.protocol === "https:" ? https : http;

  const result = await new Promise<{ status: number; body: string; location: string }>((resolve, reject) => {
    const request = client.request(url, { method: "GET", headers: { Host: url.host, ...READER_HEADERS }, timeout: 12000 }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_PAGE) {
          request.destroy(new Error("TOO_LARGE"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () =>
        resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8"), location: String(response.headers.location ?? "") })
      );
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("TIMEOUT")));
    request.on("error", reject);
    request.end();
  });

  if (result.status >= 300 && result.status < 400 && result.location) {
    if (redirects <= 0) throw new ProductPageError("That link redirects too many times");

    return getPage(new URL(result.location, url).toString(), check, redirects - 1);
  }

  return { status: result.status, body: result.body, url: url.toString() };
}

export async function fetchProduct(raw: string): Promise<PageProduct & { link: string; rooms: string[] }> {
  let page: PageResult;

  try {
    page = await getPage(raw);
  } catch (error) {
    if (error instanceof ProductPageError) throw error;
    const reason = (error as { code?: string } | null)?.code ?? (error as Error | null)?.message ?? "no answer";
    throw new ProductPageError(`The page could not be opened (${reason}). Some shops block automated visits; type the details in instead`);
  }
  if (page.status < 200 || page.status >= 300) {
    throw new ProductPageError(
      `The page could not be opened (the shop answered ${page.status}). Some shops block automated visits; type the details in instead`
    );
  }
  if (isBotCheck(page.body)) {
    throw new ProductPageError(
      "That shop checks that visitors are people, so the app cannot read the page. Type the details in yourself (open the page in your browser and copy the name, price and company)"
    );
  }
  const product = parseProductPage(page.body, page.url);
  if (isHoldingPage(product)) {
    throw new ProductPageError(
      `The shop answered with a holding page ("${product.name}") instead of the product, so nothing was filled in. Try again in a few minutes, or type the details in`
    );
  }

  return { ...product, link: page.url, rooms: guessRooms(product.name) };
}
