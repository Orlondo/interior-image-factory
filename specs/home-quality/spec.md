# Spec: Make Home quality change the image

**Status**: Implemented
**App**: interior-image-factory
**Related**: `specs/color-system-enhancements/spec.md` (the same approach, applied to color intensity)

## Goal

Choosing a different Home quality (Builder's grade layout, Everyday, Upscale, Luxury, Ultra luxury) should produce images you can tell apart. Today the five options look too similar.

## What the code does today

Measured by building the prompt for all five tiers with every other setting the same:

- Home quality changes **5 of 67 lines**, about **7% of the words** (79 of 1,168). The other 93% is identical for every tier.
- The five lines that change: the quality tier line, atmosphere, materials, camera framing, and one negative cue.
- The shared text leans high-end for every tier, including Builder's grade:
  - "Bespoke millwork and seamless built-ins"
  - "Sculptural and experimental designer furniture, collectible art objects, unconventional materials" and "avant-garde expression"
  - "Ceiling lighting direction: ..., refined and appropriate for luxury residential interiors"
  - "elegant and integrated" (ceiling), "elegant luminous glow" (lighting), "premium real-estate editorial photography" (finish)
  - "Perfect spatial balance, clean lines, no clutter"
- The avant-garde block starts with "When focal points are selected", but its lines print even when none are selected. This is an existing bug.
- The prompt's own priority line ranks Home Quality second to last, ahead of only Wall Type.
- Neighboring tiers differ mostly by a few adjectives (Everyday, Upscale and Luxury especially).
- No spec says what each tier should look like. Color got that design work; Home quality did not.
- Not checked: how much of the sameness comes from the image model, which tends to polish everything. This spec fixes the prompt first and measures the result.

## Design

### 1. Tier wording reaches the whole prompt (FR-001 to FR-004)

- **FR-001**: Every fixed line that implies luxury becomes tier-aware:
  - Millwork: "Bespoke millwork and seamless built-ins" becomes a per-tier millwork line.
  - Ceiling and lighting lines: the words "elegant", "refined" and "luxury residential" are replaced by wording that matches the tier. Your selected ceiling and lighting options are still honored exactly.
  - The finish line "premium real-estate editorial photography" becomes a per-tier photography line.
  - "Perfect spatial balance, clean lines, no clutter" becomes a per-tier staging line (see the table).
- **FR-002**: The avant-garde and sculptural lines print only when focal points are selected.
- **FR-003**: Each tier gets concrete visible cues, not only adjectives. The table below is the starting point.
- **FR-004**: In the priority line, Home Quality moves from second-to-last to just after Color Coverage. Color wording is untouched.

| | Builder's grade | Everyday | Upscale | Luxury | Ultra luxury |
|---|---|---|---|---|---|
| Room and ceiling | ordinary proportions, standard 8 ft flat ceiling | comfortable proportions, standard ceiling | generous proportions, 9 ft ceiling | high ceilings, large well-proportioned room | grand scale, double-height or exceptional ceiling where the room allows |
| Trim and doors | plain baseboards, hollow-core doors, basic window trim | simple trim, standard doors | tailored trim, solid doors | deep crown and casing, custom doors | museum-grade custom joinery, oversized doors |
| Furniture | mass-market, mixed retail pieces | practical retail furniture, a few better pieces | curated mix, quality upholstery | designer pieces, premium textiles | collectible, custom, couture furnishings |
| Lighting fixtures | basic builder fixtures, plain downlights | simple fixtures | considered fixtures, layered lighting | statement fixtures | sculptural bespoke lighting |
| Styling | tidy and lived-in, modest art, ordinary accessories | warm and lived-in, a few personal items | styled with restraint | polished, editorial | gallery-level, collected objects |
| Photography | straightforward listing photo | clean real-estate photo | editorial residential | design-magazine | architectural-hero |

### 2. Boundaries (FR-005 to FR-007)

- **FR-005**: Explicit selections win. If you pick a coffered ceiling or statement lighting on a low tier, it is honored; the tier only changes the surrounding wording, never your choice.
- **FR-006**: The one-line hints under Home quality in the Room section match the new cues.
- **FR-007**: Nothing else changes: color wording and tiers, the request body, the server route, saved setups, and the default tier (Upscale). Upscale output should stay close to today's, so existing Looks and setups keep their feel.

## Not in this build

- Changing which rooms, styles or views exist.
- New tiers or renaming the five.
- Tuning the image model's own polish beyond the prompt.

## Open decision (my default is below; say if you want otherwise)

How far apart should the tiers be? **Default: visibly different.** A real builder's-grade room looks plainer and less photogenic, and the old "no clutter" and "perfect spatial balance" lines pulled against that. The alternative is a gentler spread (everything stays attractive, with smaller steps). The low tiers will be less pretty with the default.

## Test plan

- Unit tests (`tests/home-quality.test.ts`):
  - All five tiers produce five different prompts. Builder's grade and Ultra luxury differ by at least 20% of the words, and each neighboring pair by at least 8%. Today's figure is about 7% between the extremes.
  - Builder's grade and Everyday prompts contain none of: bespoke, designer, collectible, couture, museum, premium editorial, avant-garde, "luxury residential".
  - Luxury and Ultra luxury prompts contain none of: builder-grade, stock cabinetry, hollow-core, basic builder fixtures.
  - With no focal points selected, no avant-garde or sculptural text appears. With focal points, it does.
  - Selected ceiling and lighting options appear verbatim on every tier.
  - Upscale's prompt differs from today's only where FR-001 requires it.
  - The existing 20 color-system tests pass unchanged.
- Real check, run by you after the build (the sandbox cannot call the image model): generate 5 images per tier with the same Look and rooms, then see whether you can sort them by tier without the labels. If two neighboring tiers still blur together, the next step is tuning the wording from what you see.

## Rollout

Two commits:
1. `docs(spec): add home-quality spec`
2. `feat(prompt): make home quality shape the whole prompt`

## Implementation notes

- All tier-dependent wording now lives in `lib/promptBuilder/homeQuality.ts` (one profile per tier). `lib/promptBuilder.ts` reads from it.
- Measured result (share of the prompt's words on lines that differ, default setup): Builder's grade vs Ultra luxury 21% (was 7%); neighbors 17% to 20%.
- Upscale changes only where this spec required it: the millwork line, three new cue lines (room scale, trim and doors, furniture and styling), the ceiling lighting suffix ("upscale" instead of "luxury"), the priority order, and the avant-garde lines (now only with focal points). Its staging, photography and lighting lines are unchanged.
- The Moody Luxury color mood keeps its own lighting lines, because the mood is an explicit choice. On the plainer tiers, a Moody Luxury mood still pulls the lighting toward a rich, glowing look.
- Tests: `tests/home-quality.test.ts` (11 tests) and the existing color-system tests pass unchanged.
