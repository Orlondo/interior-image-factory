import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";
import {
  guessRooms,
  productForImage,
  productLines,
  productRef,
  sanitizeProductEvery,
  sanitizeProducts,
} from "../lib/products";

const lamp = { id: "a", name: "Brass arc floor lamp", look: "a brass arc floor lamp with a linen shade", link: "https://shop.test/lamp", price: "$80", image: "", rooms: [], guessed: false };

test("rooms are guessed from the name", () => {
  assert.ok(guessRooms("Brass arc floor lamp").includes("living room"));
  assert.deepEqual(guessRooms("Matte black kitchen faucet"), ["kitchen"]);
  assert.ok(guessRooms("Waffle bath mat").includes("bathroom"));
  assert.deepEqual(guessRooms("Mystery object"), []);
});

test("sanitize keeps good products and drops junk", () => {
  const got = sanitizeProducts([
    { name: "Linen throw", link: "https://x.test/t", image: "javascript:alert(1)" },
    { name: "" },
    "junk",
    { id: "dup", name: "A" },
    { id: "dup", name: "B" },
  ]);
  assert.equal(got.length, 2);
  assert.equal(got[0]?.image, "");
  assert.ok((got[0]?.rooms.length ?? 0) > 0);
  assert.equal(sanitizeProducts("nope").length, 0);
});

test("a product only goes to rooms it fits, every Nth image, cycling", () => {
  const lampLiving = { ...lamp, rooms: ["living room"] };
  const throwBed = { ...lamp, id: "b", name: "Throw", rooms: ["bedroom"] };
  assert.equal(productForImage([lampLiving], "kitchen", 0, 1), null);
  assert.equal(productForImage([lampLiving], "living room", 0, 2)?.id, "a");
  assert.equal(productForImage([lampLiving], "living room", 1, 2), null);
  const any = [lampLiving, { ...lampLiving, id: "c" }];
  assert.deepEqual([0, 2, 4, 6].map((slot) => productForImage(any, "living room", slot, 2)?.id), ["a", "c", "a", "c"]);
  assert.equal(productForImage([throwBed], "bedroom", 0, 1)?.id, "b");
});

test("prompt line says look-alike, nothing when none", () => {
  assert.equal(productLines(null), "");
  assert.ok(productLines(lamp).includes("similar-looking"));
  assert.ok(productLines(lamp).includes("brass arc floor lamp"));
});

test("nothing set changes nothing, and setup round trips", () => {
  assert.equal("products" in buildGeneratePayload(DEFAULT_SETUP), false);
  assert.equal(sanitizeProductEvery(99), 2);
  const setup = sanitizeSetup({ ...DEFAULT_SETUP, products: [lamp], productEvery: 3 });
  assert.equal(setup.products.length, 1);
  const payload = buildGeneratePayload(setup) as Record<string, unknown>;
  assert.equal((payload.products as unknown[]).length, 1);
  assert.equal(payload.productEvery, 3);
});

import { checkPublicUrl, parseProductPage } from "../lib/productPage";

test("a product page is read from JSON-LD, then Open Graph", () => {
  const ld = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [{ "@type": "Product", name: "Brass arc lamp", image: ["/i/lamp.jpg"], offers: { price: "79.5", priceCurrency: "USD" } }],
  })}</script>`;
  assert.deepEqual(parseProductPage(ld, "https://shop.test/p/lamp"), { name: "Brass arc lamp", price: "$79.50", image: "https://shop.test/i/lamp.jpg", brand: "", store: "Shop" });
  const og = '<meta property="og:title" content="Linen &amp; cotton throw"><meta property="og:image" content="//cdn.test/t.jpg"><meta property="product:price:amount" content="45"><meta property="product:price:currency" content="EUR">';
  assert.deepEqual(parseProductPage(og, "https://shop.test/x"), { name: "Linen & cotton throw", price: "€45", image: "https://cdn.test/t.jpg", brand: "", store: "Shop" });
  assert.deepEqual(parseProductPage("<p>hi</p>"), { name: "", price: "", image: "", brand: "", store: "" });
});

test("only public web addresses are opened", async () => {
  for (const bad of ["", "ftp://x.test/a", "file:///etc/passwd", "http://localhost/x", "http://127.0.0.1:3000/", "http://192.168.1.5/", "http://10.0.0.2/", "http://169.254.169.254/latest"]) {
    await assert.rejects(() => checkPublicUrl(bad), bad);
  }
});

import http from "node:http";
import { getPage } from "../lib/productPage";

test("the reader sends only the plain headers and follows redirects", async () => {
  const seen: http.IncomingHttpHeaders[] = [];
  const server = http.createServer((req, res) => {
    seen.push(req.headers);
    if (req.url === "/start") {
      res.writeHead(302, { Location: "/final" });
      res.end();
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<title>Sofa</title>");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  try {
    const page = await getPage(`http://127.0.0.1:${port}/start`, async (raw) => new URL(raw));
    assert.equal(page.status, 200);
    assert.ok(page.body.includes("Sofa"));
    assert.ok(page.url.endsWith("/final"));
    const headers = seen[1] ?? {};
    assert.equal(headers["accept-encoding"], "identity");
    assert.equal("sec-fetch-mode" in headers, false);
    assert.equal("accept" in headers, false);
  } finally {
    server.close();
  }
});

test("new setups start with a neutral base and decor-only color; saved ones keep theirs", () => {
  assert.equal(DEFAULT_SETUP.colorStrategy, "Neutral Base");
  assert.equal(DEFAULT_SETUP.colorCoverage, "Decor Only");
  const saved = sanitizeSetup({ ...DEFAULT_SETUP, colorStrategy: "Designer Layered", colorCoverage: "Architectural Surfaces" });
  assert.equal(saved.colorStrategy, "Designer Layered");
  assert.equal(saved.colorCoverage, "Architectural Surfaces");
  // color intensity is untouched
  assert.equal(sanitizeSetup({}).colorIntensity, DEFAULT_SETUP.colorIntensity);
});

test("matching wording names the photo; look-alike wording does not", () => {
  const matched = productLines(lamp, true);
  const words = productLines(lamp, false);
  assert.match(matched, /attached product photo/);
  assert.doesNotMatch(words, /attached/);
  assert.equal(productLines(lamp), words);
  assert.equal(productLines(null, true), "");
  assert.ok(matched.includes(lamp.look));
});

test("the picture note names each picture in order", async () => {
  const { productPhotoNote } = await import("../lib/products");
  assert.match(productPhotoNote(true), /Image 1 is the room[\s\S]*Image 2 is a photo of the product/);
  assert.match(productPhotoNote(false), /^\n\nImage 1 is a photo of the product/);
});

test("the match switch is on by default and only sent when off", () => {
  assert.equal(DEFAULT_SETUP.productMatch, true);
  const withProducts = { ...DEFAULT_SETUP, products: [lamp] };
  assert.equal("productMatch" in buildGeneratePayload(withProducts), false);
  assert.equal(buildGeneratePayload({ ...withProducts, productMatch: false }).productMatch, false);
  assert.equal("productMatch" in buildGeneratePayload({ ...DEFAULT_SETUP, productMatch: false }), false);
  assert.equal(sanitizeSetup({ productMatch: false }).productMatch, false);
  assert.equal(sanitizeSetup({}).productMatch, true);
});

test("price and company are read from visible page text when the page has no price data", () => {
  const page = `<html><head><title>Julian | Lamps Plus</title><meta property="og:title" content="Possini Euro Julian 22 Inch Drum Ceiling Light"></head><body>
<div><span>Price:</span> <span>$499.99</span></div><script>var related = {"price": "12.00"};</script>
<table><tr><td>Brand</td><td>Possini Euro Design</td></tr><tr><td>Color</td><td>Bronze</td></tr></table></body></html>`;
  const got = parseProductPage(page, "https://www.lampsplus.com/p/julian/");
  assert.equal(got.price, "$499.99");
  assert.equal(got.brand, "Possini Euro Design");
  assert.equal(got.store, "Lampsplus");
  assert.equal(parseProductPage("<p>Price: $1,299.50</p>").price, "$1,299.50");
  assert.equal(parseProductPage('<span itemprop="price" content="64.00"></span>').price, "$64");
  assert.equal(parseProductPage('<script>var x = {"price": "12.00"};</script>').price, "");
});

test("the maker comes from the product's brand; the shop's name is its own field", () => {
  const ld = JSON.stringify({ "@type": "Product", name: "Lamp", brand: { "@type": "Brand", name: "Visual Comfort" } });
  assert.equal(parseProductPage(`<script type="application/ld+json">${ld}</script>`, "https://shop.test/x").brand, "Visual Comfort");
  assert.equal(parseProductPage('<meta property="product:brand" content="Rejuvenation">', "https://shop.test/x").brand, "Rejuvenation");
  assert.equal(parseProductPage("<p>Brand: Hunter Fan</p>").brand, "Hunter Fan");
  const shop = parseProductPage('<meta property="og:site_name" content="Lamps Plus">', "https://www.lampsplus.com/p");
  assert.deepEqual([shop.brand, shop.store], ["", "Lamps Plus"]);
  assert.equal(parseProductPage("<p>x</p>", "https://www.arhaus.com/products/x").store, "Arhaus");
  assert.equal(parseProductPage("<p>x</p>").store, "");
});

test("a product's maker and shop are kept and recorded on the image only when there are some", () => {
  const withBrand = sanitizeProducts([{ name: "Julian light", brand: " Possini Euro Design ", store: " Lamps Plus ", link: "https://s.test/x" }]);
  assert.equal(withBrand[0]?.brand, "Possini Euro Design");
  assert.equal(withBrand[0]?.store, "Lamps Plus");
  assert.equal(productRef(withBrand[0] as never).brand, "Possini Euro Design");
  assert.equal(productRef(withBrand[0] as never).store, "Lamps Plus");
  const without = sanitizeProducts([{ name: "Plain lamp" }]);
  assert.equal("brand" in (without[0] as object), false);
  assert.equal("brand" in productRef(without[0] as never), false);
  assert.equal("store" in productRef(without[0] as never), false);
});
