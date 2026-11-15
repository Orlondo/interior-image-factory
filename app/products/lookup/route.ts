import { NextResponse } from "next/server";
import { ProductPageError, fetchProduct } from "@/lib/productPage";

export const runtime = "nodejs";

/** POST { url }: the product's name, price, picture and a guess at the rooms it fits, read from its shop page. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };

    if (typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json({ error: "Paste a product link first" }, { status: 400 });
    }

    return NextResponse.json(await fetchProduct(body.url));
  } catch (error) {
    if (error instanceof ProductPageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "The product could not be read" }, { status: 500 });
  }
}
