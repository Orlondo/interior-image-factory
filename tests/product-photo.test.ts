import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { fetchProductPhoto, fetchProductPhotos, sniffImage, MAX_PHOTO_BYTES } from "../lib/productPhoto";

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 2)]);

const allowLocal = async (raw: string) => new URL(raw);

async function withServer(handler: http.RequestListener, run: (base: string) => Promise<void>) {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

test("pictures are recognised by their bytes, not by what the server says", () => {
  assert.equal(sniffImage(PNG)?.mime, "image/png");
  assert.equal(sniffImage(JPG)?.extension, "jpg");
  assert.equal(sniffImage(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(8)]))?.mime, "image/webp");
  assert.equal(sniffImage(Buffer.from("<html>not a picture</html>")), null);
});

test("a product picture is downloaded, following a redirect, with only the reader's headers", async () => {
  let seen: http.IncomingHttpHeaders = {};
  await withServer(
    (req, res) => {
      if (req.url === "/start") {
        res.writeHead(302, { Location: "/photo.png" });
        res.end();
        return;
      }
      seen = req.headers;
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(PNG);
    },
    async (base) => {
      const photo = await fetchProductPhoto(`${base}/start`, allowLocal);
      assert.equal(photo?.mime, "image/png");
      assert.equal(photo?.b64, PNG.toString("base64"));
      assert.equal(seen["accept-encoding"], "identity");
      assert.equal(seen["sec-fetch-mode"], undefined);
    }
  );
});

test("not a picture, a failed page, or too large: skipped, never thrown", async () => {
  await withServer(
    (req, res) => {
      if (req.url === "/html") return void res.end("<html></html>");
      if (req.url === "/gone") {
        res.writeHead(404);
        return void res.end(PNG);
      }
      res.end(Buffer.concat([PNG, Buffer.alloc(MAX_PHOTO_BYTES)]));
    },
    async (base) => {
      assert.equal(await fetchProductPhoto(`${base}/html`, allowLocal), null);
      assert.equal(await fetchProductPhoto(`${base}/gone`, allowLocal), null);
      assert.equal(await fetchProductPhoto(`${base}/big`, allowLocal), null);
      assert.equal(await fetchProductPhoto("", allowLocal), null);
      assert.equal(await fetchProductPhoto("file:///etc/passwd", allowLocal), null);
    }
  );
});

test("private addresses are refused by the default check", async () => {
  assert.equal(await fetchProductPhoto("http://127.0.0.1:9/x.png"), null);
  assert.equal(await fetchProductPhoto("http://192.168.1.5/x.png"), null);
});

test("each distinct address is fetched once and failures are left out", async () => {
  const calls: string[] = [];
  const got = await fetchProductPhotos(["https://a/1", "https://a/1", "", "https://a/2"], async (address) => {
    calls.push(address);
    return address.endsWith("1") ? { b64: "x", mime: "image/png", extension: "png" } : null;
  });
  assert.deepEqual(calls.sort(), ["https://a/1", "https://a/2"]);
  assert.deepEqual([...got.keys()], ["https://a/1"]);
});
