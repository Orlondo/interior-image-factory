# Color moods, palette families and Looks

## Why
Looks were presets of the same five color moods, and most used Auto palette family, so many Looks produced similar images. A mood was one soft sentence that strategy, coverage and palette family overrode.

## Moods
Five moods added after the original five (the original five and their prompt wording are unchanged, so pristine prompt hashes are identical):

| Mood | Default palette family | Notes |
|---|---|---|
| Monochrome Tonal | Monochrome | One hue family in pale, mid and deep values |
| Soft Pastel | Pastel Mixed | High value, low saturation |
| Vivid Eclectic | Vivid Mixed | Saturated, several hues, calm neutrals |
| Cool Modern | Slate & Steel | Slate, steel, icy blue, cool metals |
| Dark Earthy | Dark Earthy Mixed | Also uses the low warm lighting branch (same as Moody Luxury) |

Each new mood has a multi-sentence direction in `COLOR_MOOD_DIRECTION_MAP` (value range, temperature, saturation, materials), not one sentence.

## Palette families
Five mixed families added to `heroColors`: Monochrome, Pastel Mixed, Vivid Mixed, Slate & Steel, Dark Earthy Mixed. Each has four palette variants with explicit complementary accents. They appear under "Mixed families" in Palette family and work with any mood. Monochrome has its own hero directive ("one hue family") instead of the generic multi-color text.

## Looks
- 16 new built-in Looks (24 total): 11 using existing controls (Sage & Cream, Terracotta Warm, Olive Earth, Navy Study, Emerald Library, Burgundy Lounge, Plum Evening, Mustard Retro, Teal Fresh, Warm Eclectic, Rust & Gold) and 5 for the new moods (Monochrome Tonal, Soft Pastel, Vivid Eclectic, Cool Modern, Dark Earthy Retreat).
- `LOOK_GROUPS` groups them in the picker: Calm & neutral, Natural & earthy, Designer, Bold & dramatic. Every built-in Look is in exactly one group (tested). Saved Looks stay under "Your Looks".

## Limits
- Mood is still low in the color rule priority (below strategy, coverage and palette family). The new moods carry weight mainly through their default palette family; choosing another palette family overrides it.
- Light & Airy and Coastal Neutral still share the Cool Mixed default; they were left alone to keep existing prompts byte-identical.
- Tests: `tests/color-moods.test.ts`.

## Update: Looks also set walls, ceilings and ceiling lights

- Every built-in Look carries `details` (wall type, ceiling type, ceiling lights). Choosing a Look sets those three Details fields along with the colors. Window style, focal points and outside view are never changed by a Look.
- Choosing a Look replaces the current picks in those three fields. The confirmation line under the picker says so and offers **Undo details**, which restores the previous picks and leaves the colors alone. Undo goes away after saving or deleting a Look.
- Designer Layered carries today's defaults, so switching back to it restores them.
- Saved Looks: a checkbox, "Include walls, ceilings and ceiling lights when this Look is applied" (off by default), stores the current picks with the Look. Older saved Looks have no details and behave as before. Stored details are validated on load; invalid ones are dropped.
- Whether a Look is "active" is still decided by the six color fields only, so details never make a Look show as Custom.
- Tests: `tests/look-details.test.ts`.
