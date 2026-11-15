"use client";

import { useState } from "react";
import { ChipGroup } from "@/components/ui-modernization";
import { rooms as allRooms } from "@/lib/combinations";
import {
  MAX_PRODUCTS,
  PRODUCT_EVERY_MAX,
  describeProducts,
  guessRooms,
  type Product,
} from "@/lib/products";
import type { Setup } from "@/lib/setup";
import { SelectField } from "./fields";
import { SectionCard } from "./SectionCard";

type ProductsSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

const BLANK = (id: string): Product => ({ id, name: "", look: "", link: "", price: "", image: "", rooms: [], guessed: false });

/**
 * Products: paste a shop link, and the name, price, picture and fitting rooms are read from the page.
 * Some images then include a look-alike of the product, and the video app lists it with a timestamp.
 * Everything stays editable. With no products, nothing changes.
 */
export function ProductsSection({ setup, update }: ProductsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const products = setup.products;

  const edit = (id: string, patch: Partial<Product>) =>
    update({ products: products.map((product) => (product.id === id ? { ...product, ...patch } : product)) });

  const add = () => {
    const id = `p${Date.now().toString(36)}`;
    update({ products: [...products, BLANK(id)] });
  };

  const fill = async (product: Product) => {
    if (!product.link.trim()) return;
    setBusy(product.id);
    setNote("");
    try {
      const response = await fetch("/products/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: product.link }),
      });
      const data = (await response.json()) as { error?: string; name?: string; price?: string; image?: string; link?: string; rooms?: string[] };

      if (!response.ok) {
        setNote(data.error ?? "The product could not be read");
        return;
      }
      const name = data.name || product.name;
      edit(product.id, {
        name,
        look: product.look || name,
        price: data.price || product.price,
        image: data.image || product.image,
        link: data.link || product.link,
        rooms: product.rooms.length > 0 && !product.guessed ? product.rooms : data.rooms ?? guessRooms(name),
        guessed: !(product.rooms.length > 0 && !product.guessed),
      });
      const missing = [!data.name && "name", !data.price && "price", !data.image && "picture"].filter(Boolean);
      setNote(
        missing.length === 0
          ? "Found the name, price and picture. The price is as of now; check it before you publish."
          : `Could not find the ${missing.join(", ")}. Type it in yourself.`
      );
    } catch {
      setNote("The product could not be read. Check your connection or type the details in.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SectionCard
      id="products"
      title="Products"
      icon="details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((previous) => !previous)}
      summary={describeProducts(products) || "Optional: real items to show as look-alikes"}
    >
      <div className="space-y-4">
        <p className="text-xs text-[#98A2B3]">
          Paste a link from a shop. The app reads the name, price and picture, and guesses which rooms it fits. Some
          images then include a similar-looking version of it (never the exact item). The video app can list each
          one with the time it appears.
        </p>

        {products.map((product) => (
          <div key={product.id} className="space-y-2 rounded-lg border border-[#2A3345] p-3">
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[14rem] flex-1 rounded bg-[#0F1522] px-2 py-1 text-sm"
                value={product.link}
                placeholder="Product link"
                onChange={(event) => edit(product.id, { link: event.target.value })}
              />
              <button type="button" disabled={!product.link.trim() || busy === product.id} onClick={() => fill(product)}>
                {busy === product.id ? "Reading…" : "Fill from link"}
              </button>
              <button type="button" onClick={() => update({ products: products.filter((item) => item.id !== product.id) })}>
                Remove
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[10rem] flex-1 rounded bg-[#0F1522] px-2 py-1 text-sm"
                value={product.name}
                placeholder="Name"
                onChange={(event) => edit(product.id, { name: event.target.value, ...(product.guessed || product.rooms.length === 0 ? { rooms: guessRooms(event.target.value), guessed: true } : {}) })}
              />
              <input
                className="w-24 rounded bg-[#0F1522] px-2 py-1 text-sm"
                value={product.price}
                placeholder="Price"
                onChange={(event) => edit(product.id, { price: event.target.value })}
              />
            </div>
            <input
              className="w-full rounded bg-[#0F1522] px-2 py-1 text-sm"
              value={product.look}
              placeholder="What it looks like (used for the image). Defaults to the name"
              onChange={(event) => edit(product.id, { look: event.target.value })}
            />
            <p className="text-xs text-[#98A2B3]">
              Rooms it can appear in{product.guessed ? " (guessed from the name, check them)" : ""}
              {product.rooms.length === 0 ? ": any room" : ""}
            </p>
            <ChipGroup
              options={allRooms.map((room) => ({ value: room, label: room }))}
              selectedValues={product.rooms}
              onToggleValue={(room) =>
                edit(product.id, {
                  rooms: product.rooms.includes(room) ? product.rooms.filter((item) => item !== room) : [...product.rooms, room],
                  guessed: false,
                })
              }
              ariaLabel={`Rooms for ${product.name || "this product"}`}
            />
          </div>
        ))}

        {note ? <p className="text-xs text-[#98A2B3]" role="status">{note}</p> : null}

        {products.length < MAX_PRODUCTS ? (
          <button type="button" onClick={add}>
            Add a product
          </button>
        ) : null}

        {products.length > 0 ? (
          <SelectField
            label="How often a product appears"
            value={String(setup.productEvery)}
            onChange={(value) => update({ productEvery: Number(value) })}
          >
            {Array.from({ length: PRODUCT_EVERY_MAX }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count === 1 ? "Every image of a fitting room" : `Every ${count}${count === 2 ? "nd" : count === 3 ? "rd" : "th"} image of a fitting room`}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>
    </SectionCard>
  );
}
