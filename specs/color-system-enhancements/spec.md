# Feature: Enhanced Interior Design Color System

## Goal

Increase visual diversity across generated interiors while maintaining professional interior design aesthetics.

**Problem**: Current generations are overly biased toward beige, cream, greige, oak, and warm neutral palettes, even when Color Presence is set to maximum.

**Objective**: Produce more varied, designer-quality color stories while preserving realism and style consistency.

---

## New Controls

### Color Strategy

**Location**: New control directly below Color Mood

**Options**:
- Neutral Base
- Accent Color
- Designer Layered
- Statement Room
- Gallery Inspired
- Nature Inspired
- Color Drenched

**Default**: Designer Layered

**Behavior**:

| Strategy | Description |
|----------|-------------|
| **Neutral Base** | Mostly neutral palette with minimal color accents |
| **Accent Color** | One dominant accent color applied through decor, artwork, textiles, and accessories |
| **Designer Layered** | Multiple coordinated colors; mimics professional interior design palettes |
| **Statement Room** | One strong focal color appearing in major furniture and architectural elements |
| **Gallery Inspired** | Palette derived from artwork or focal feature |
| **Nature Inspired** | Palette derived from natural environments (forest, desert, coastal, mountain) |
| **Color Drenched** | Strong palette distributed throughout; walls, furniture, textiles, decor all participate |

---

### Hero Color

**Location**: New control directly below Color Strategy

**Options**:
- Auto
- Deep Blue
- Teal
- Emerald
- Olive
- Sage
- Terracotta
- Rust
- Burgundy
- Plum
- Mustard
- Gold
- Mixed

**Default**: Auto

**Behavior**: When selected, the chosen color should appear repeatedly throughout the generated room via:
- Artwork
- Decor
- Pillows
- Textiles
- Furniture accents
- Architectural details

Effect should feel intentional and designer-curated.

---

### Color Intensity

**Action**: Rename existing "Color Presence" control to "Color Intensity"

**Existing slider range**: 0–100 (unchanged)

**Updated interpretation**:

| Range | Level | Behavior |
|-------|-------|----------|
| 0–25 | Subtle | Minimal color accents |
| 26–50 | Balanced | Moderate color usage |
| 51–75 | Noticeable | Clear color story |
| 76–100 | Strong | Bold designer palette |

Prompt generation scales dynamically based on intensity level.

---

### Auto Palette Variation

**Location**: New checkbox below Color Intensity

**Label**: "Auto Palette Variation"

**Default**: Enabled (checked)

**Behavior**: When generating multiple images, each image receives a unique palette variation while remaining consistent with style, room type, color mood, and home quality.

**Example output** (6-image batch):
- Image 1: Sage + Oak
- Image 2: Navy + Brass
- Image 3: Terracotta + Cream
- Image 4: Olive + Walnut
- Image 5: Teal + Gold
- Image 6: Rust + Stone

Variation should never produce random or clashing palettes.

---

## Refactored Architecture

### New Module: `lib/promptBuilder/colorPalette.ts`

**Purpose**: Centralize all color palette selection, generation, and strategy logic.

**Responsibilities**:
- Palette selection and generation
- Palette variation across batch images
- Hero color selection and application
- Strategy mapping to prompt language
- Intensity mapping to design language
- Auto palette variation logic

**Exports**:
- `selectPalette(strategy, intensity, colorMood, style, heroColor)`: Returns palette configuration
- `generatePaletteVariation(basePalette, index, maxImages)`: Returns varied palette for image N
- `getHeroColorDirective(heroColor, strategy)`: Returns prompt language for hero color emphasis
- `getStrategyDirective(strategy, intensity)`: Returns prompt language for color strategy
- `getIntensityDirective(intensity)`: Returns prompt language for intensity level

**Integration**: `lib/promptBuilder.ts` consumes this module.

---

## Updated Data Flow

```
UI Controls:
  Color Strategy → selected strategy
  Hero Color → selected hero color
  Color Intensity → 0–100 value
  Auto Palette Variation → checkbox state
    ↓
POST /generate payload:
  {
    colorStrategy,
    heroColor,
    colorIntensity,
    autoPaletteVariation,
    maxImages
  }
    ↓
Route parsing & validation
    ↓
For each image (0 to maxImages):
  → colorPalette.selectPalette(strategy, intensity, colorMood, style, heroColor)
  → colorPalette.generatePaletteVariation(palette, index, maxImages)
  → buildPrompt(…) with injected palette & intensity directives
    ↓
OpenAI API receives palette-aware, hero-color-reinforced, intensity-scaled prompts
    ↓
Generated images respect all color controls
```

---

## Prompt Builder Integration

### Updates to `lib/promptBuilder.ts`

1. **Import color palette module**
   ```typescript
   import { selectPalette, generatePaletteVariation, getStrategyDirective, getIntensityDirective, getHeroColorDirective } from './colorPalette';
   ```

2. **Extend `buildPrompt()` signature**
   ```typescript
   export function buildPrompt(
     room: RoomType,
     roomSize: string,
     style: string,
     colorMood: ColorMood,
     colorIntensity: number,
     colorStrategy: string,
     heroColor: string,
     homeQuality: HomeQuality,
     wallColorPalette: string,
     colorProfileTypes: string[],
     view: string,
     windowStyleTypes: string[],
     focalPointTypes: string[],
     wallTypes: string[],
     ceilingTypes: string[],
     ceilingLightTypes: string[],
     batchIndex: number = 0,
     maxImages: number = 12
   ) { ... }
   ```

3. **Inject color directives into prompt**
   - Add palette selection directives
   - Add intensity directives
   - Add hero color directives
   - Add strategy-specific language

---

## UI Implementation Constraints

- **Reuse existing patterns**: Use existing select/checkbox components
- **Extract color logic**: No component should exceed 400 lines
- **Keep components dumb**: Pass all logic down from page.tsx via props
- **Follow project styling**: Match existing design system and layout
- **Do not modify**: Unrelated generation logic or existing image flow
- **Maintain backwards compatibility**: Current presets must continue working

---

## Testing Approach

1. **Control interaction**
   - Verify each Color Strategy produces distinctly different color language in prompts
   - Verify Hero Color selection reinforces color throughout prompt
   - Verify Color Intensity maps to corresponding language levels

2. **Palette variation**
   - Generate 6+ image batch with Auto Palette Variation enabled
   - Verify each image receives unique palette variation
   - Verify no clashing or off-brand colors appear

3. **Integration**
   - All combinations of controls should produce valid prompts
   - No TypeScript or compilation errors
   - Backwards compatibility: existing requests without new controls should fall back gracefully

4. **Visual output**
   - Neutral Base at low intensity: almost monochromatic
   - Designer Layered at high intensity: bold, coordinated, multi-color story
   - Hero Color selection: targeted color appears consistently
   - Nature Inspired: appropriate seasonal/environmental palettes

---

## Files to Create/Modify

**Create**:
- `lib/promptBuilder/colorPalette.ts` (new module)

**Modify**:
- `lib/promptBuilder.ts` (extend `buildPrompt()`, import colorPalette module)
- `app/generate/route.ts` (parse new payload fields, thread through to buildPrompt)
- `app/page.tsx` (add Color Strategy, Hero Color, rename Color Presence to Color Intensity, add Auto Palette Variation checkbox)
- `lib/combinations.ts` (add constants for new strategies, hero colors)

**No changes to**:
- Image generation flow
- Batch/request infrastructure
- Existing validation logic
- File structure or other unrelated systems

---

## Backwards Compatibility

- Existing requests without new color controls use sensible defaults
- `colorStrategy` defaults to "Designer Layered"
- `heroColor` defaults to "Auto"
- `colorIntensity` maintains 0–100 range (renamed from colorPresence)
- `autoPaletteVariation` defaults to true
- All legacy payload structures continue to work
