import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";
import {
  guessRooms,
  productForImage,
  productLines,
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
  assert.deepEqual(parseProductPage(ld, "https://shop.test/p/lamp"), { name: "Brass arc lamp", price: "$79.50", image: "https://shop.test/i/lamp.jpg" });
  const og = '<meta property="og:title" content="Linen &amp; cotton throw"><meta property="og:image" content="//cdn.test/t.jpg"><meta property="product:price:amount" content="45"><meta property="product:price:currency" content="EUR">';
  assert.deepEqual(parseProductPage(og, "https://shop.test/x"), { name: "Linen & cotton throw", price: "€45", image: "https://cdn.test/t.jpg" });
  assert.deepEqual(parseProductPage("<p>hi</p>"), { name: "", price: "", image: "" });
});

test("only public web addresses are opened", async () => {
  for (const bad of ["", "ftp://x.test/a", "file:///etc/passwd", "http://localhost/x", "http://127.0.0.1:3000/", "http://192.168.1.5/", "http://10.0.0.2/", "http://169.254.169.254/latest"]) {
    await assert.rejects(() => checkPublicUrl(bad), bad);
  }
});
