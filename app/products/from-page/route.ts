import { NextResponse } from "next/server";
import { ProductPageError, readProductFromPage } from "@/lib/productPage";

export const runtime = "nodejs";

/** POST { page, url? }: the product's name, price, maker, shop and picture, read from page data the person copied from their own browser (for shops that turn away the app's own visits). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { page?: unknown; url?: unknown };

    if (typeof body.page !== "string" || !body.page.trim()) {
      return NextResponse.json({ error: "Paste the product data first" }, { status: 400 });
    }

    return NextResponse.json(readProductFromPage(body.page, typeof body.url === "string" ? body.url : ""));
  } catch (error) {
    if (error instanceof ProductPageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "The product could not be read" }, { status: 500 });
  }
}
