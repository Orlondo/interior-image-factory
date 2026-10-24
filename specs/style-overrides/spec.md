# Spec: Let a style set its own light, staging and framing (Liminal spaces first)

**Status**: Implemented
**App**: interior-image-factory
**Related**: `specs/home-quality/spec.md` (the same cause: shared wording outvoting one option)

## Goal

Choosing "liminal spaces" as the Interior design style should give an empty, transitional, slightly uncanny space. Today it gives a bright, styled room with a hint of strangeness.

## What the code does today

The style's own direction is one sentence ("Transitional uncanny ambiance, sparse composition, atmospheric lighting, quiet emptiness..."). Shared lines, which every style receives, say the opposite:

- Lighting: "Bright natural daylight with an airy, sunlit interior feel", "Lifted midtones", "high-key exposure". Only the Moody Luxury color mood gets different lighting lines.
- Camera: "premium real-estate editorial photography" (or the tier's version), "tack-sharp".
- Staging and furniture: each Home quality tier asks for curated furniture, layered rugs and considered decor, or "perfect spatial balance".
- Ceiling lighting default: "concealed cove lighting" for the Upscale tier and above.
- "Prevent flat monotony by varying tones, textures and material layers", which is the opposite of repetitive sameness.
- Framing: "Editorial residential framing with refined composition".

Liminal is the only style that depends on light, emptiness and sameness, so it is the one outvoted. Other styles are mostly about furniture and materials, which the shared lines support.

## Design

- **FR-001**: A style can override seven shared lines: lighting bullets, the atmosphere line, the camera finish line, the composition target, the staging line, the furniture and styling line, and the "prevent flat monotony" line. It can also add one negative cue and change the default ceiling lighting. A style with no override is unchanged, byte for byte.
- **FR-002**: Liminal spaces uses it:
  - Direction: empty or nearly empty, no people, long sightlines and repeating geometry (doorways, thresholds, evenly spaced fixtures), plain finishes, a faint sense of déjà vu, realistic rather than stylized.
  - Lighting: flat, even artificial light from overhead fixtures, slightly dim and slightly warm, soft uniform shadows, no sun beams, no glow or cove lighting. Windows, if any, show an overcast or empty view.
  - Camera: plain, unstyled snapshot look with a little grain; one-point perspective down a long sightline.
  - Staging and furniture: none or one or two plain pieces; no vignettes, plants or decor accessories.
  - Ceiling lighting default: evenly spaced flush panels or recessed cans (your selection still wins).
  - Sameness: surfaces stay plain and repetitive; a mild flat look is intended.
  - Negative: no people or pets, no dramatic sunbeams, no styled vignettes, no magazine look.
- **FR-003**: The style's lighting wins over the Moody Luxury mood's lighting. Everything else about the mood (palette, color rules) still applies.
- **FR-004**: Home quality, color and room settings still apply. Materials, millwork, room scale and trim still follow the tier, so a Luxury liminal space is an empty luxury space, and a Builder's grade one is a plain one.

## Known limits

- The Home quality tier line ("designer furniture, polished composition" for Luxury) and your color settings still print as they do for every style. A Luxury or Ultra luxury liminal image can therefore still lean toward polish, and "Accent color intensity rule" still asks for visible accents. If you see that, the next step is to let a style soften those too.

## Not in this build

- Other styles. Minimalist and Scandinavian may also be pulled toward styling by the shared lines. Check them after you look at Liminal output.
- A "style overrides" screen. The overrides live in `lib/promptBuilder/styleOverrides.ts`.

## Assumption to check

You did not say which kind of liminal you expect, so the wording blends the two common ones: empty fluorescent-lit institutional or office-like spaces, and empty dated residential rooms. If your images should lean one way, only the Liminal entry in `styleOverrides.ts` changes.

## Test plan

- Liminal prompts contain the override lines and none of the daylight, "sunlit", "editorial", "cove lighting" (default), "Prevent flat monotony", "curated" (from the staging and furniture lines) wording, for all five tiers.
- Every other style produces exactly the same prompt as before the change.
- The user's own ceiling lighting choice still appears in a Liminal prompt.
- Moody Luxury plus Liminal uses the Liminal lighting.
- Check by eye: five Liminal images at the same settings, then tell me what is off.
