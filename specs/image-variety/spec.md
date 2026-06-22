# Image Variety

## Goal

Ensure generated image batches contain meaningful visual variation while preserving the selected room type and design style.

## Problem

Current batches frequently generate near-identical images.

Examples of repetition:

- Same camera angle
- Same furniture placement
- Same room layout
- Same composition
- Same focal point
- Same lighting arrangement

The result feels like minor edits of a single image instead of unique concepts.

## Requirements

### Camera Variation

Each batch should include a mix of:

- Wide room shot
- Corner perspective
- Eye-level perspective
- Low-angle perspective
- High-angle perspective
- Architectural detail shot

### Composition Variation

Vary:

- Furniture placement
- Focal wall placement
- Window placement
- Traffic flow
- Room orientation

### Lighting Variation

Vary:

- Morning light
- Afternoon light
- Golden hour
- Overcast daylight
- Moody interior lighting
- Mixed lighting

### Styling Variation

Maintain selected style but vary:

- Materials
- Textures
- Art
- Decor
- Accent furniture
- Accessories

### Layout Variation

Create meaningfully different room layouts.

Example:

Image 1:
- Sofa centered

Image 2:
- Sofa rotated

Image 3:
- Fireplace focal point

Image 4:
- Window focal point

### Variety Target

A batch of 12 images should not appear to be 12 versions of the same room.

The batch should appear to contain multiple distinct design concepts.

### Color Palette Variation

For each generated image, vary the color palette using options such as:

- Warm neutrals
- Cool neutrals
- Earth tones
- Soft monochrome
- High-contrast black and white
- Muted greens
- Warm beige and walnut
- Cream, taupe, and charcoal
- Clay, terracotta, and sand
- Deep navy and brass accents

**Rules:**

- Color variation must stay appropriate to the selected design style.
- Do not make colors random or chaotic.
- Do not use bright, unrealistic colors unless the selected style supports it.
- Avoid generating every image with the same beige/gray palette.

### Color Direction

Generated interiors should favor professionally designed neutral color palettes.

Preferred color palettes:

- Warm white
- Ivory
- Cream
- Linen
- Taupe
- Greige
- Sand
- Oatmeal
- Natural oak
- Walnut
- Light stone
- Travertine
- Warm charcoal

Avoid:

- Blue accent walls
- Bright colored walls
- Highly saturated paint colors
- Artificial-looking color palettes
- Excessive cool gray tones

Style guidance:

Color palettes should feel high-end, timeless, architectural, editorial, and designer-curated.

Accent colors should be subtle and optional. Examples include olive, sage, terracotta, cognac leather, brass, and black accents. Accent colors should not dominate the room.

## Accent Color Variation

### Goal

Maintain sophisticated neutral interiors while introducing subtle color variation across generated images.

### Problem

Current images are becoming too monochromatic.

The room should feel professionally designed, not colorless.

### Requirements

Every image should contain:

- A neutral foundation palette
- One primary accent color direction

### Neutral Foundation

Use:

- Ivory
- Cream
- Taupe
- Greige
- Linen
- Oak
- Walnut
- Travertine

### Accent Color Directions

Rotate naturally between:

- Sage Green
- Olive Green
- Dusty Blue
- Deep Navy
- Terracotta
- Rust
- Cognac Leather
- Muted Plum
- Charcoal
- Brass and Gold
- Forest Green
- Soft Black

### Rules

Accent colors should appear in:

- Pillows
- Artwork
- Decor
- Upholstery
- Accent chairs
- Throws
- Decorative objects

Avoid:

- Bright colored walls
- Neon colors
- Entire rooms dominated by the accent color

### Variety

Generated images within the same batch should use different accent color directions.

Example:

Image 1:
Warm Neutral + Sage

Image 2:
Warm Neutral + Terracotta

Image 3:
Warm Neutral + Dusty Blue

Image 4:
Warm Neutral + Cognac

### Acceptance Criteria

Images remain cohesive and luxurious.

Color palettes vary across the batch.

Rooms do not feel repetitive.

Rooms do not feel monochromatic.

## Color Mood

### Goal

Allow users to guide the overall color palette of generated interiors.

### Problem

The model currently chooses color palettes automatically, which can lead to repetitive or undesirable color choices.

### New Control

Add a Color Mood selector.

Default:

Warm Neutral

### Options

#### Warm Neutral

Characteristics:

- Cream
- Ivory
- Taupe
- Greige
- Oatmeal
- Walnut
- Oak
- Travertine

Feel:

- Timeless
- Designer-curated
- High-end

#### Organic Earthy

Characteristics:

- Clay
- Terracotta
- Sand
- Olive
- Sage
- Walnut
- Natural stone

Feel:

- Organic Modern
- Nature-inspired

#### Light & Airy

Characteristics:

- Soft white
- Linen
- Pale oak
- Light beige
- Soft gray

Feel:

- Bright
- Spacious
- Coastal-adjacent

#### Moody Luxury

Characteristics:

- Charcoal
- Espresso
- Dark walnut
- Black accents
- Brass accents

Feel:

- Dramatic
- Luxury
- Editorial

#### Coastal Neutral

Characteristics:

- Warm white
- Driftwood
- Sand
- Linen
- Soft blue-gray accents

Feel:

- Relaxed
- Refined
- Coastal

### Requirements

- Color Mood appears in Main Prompt Setup.
- Default value is Warm Neutral.
- Selected Color Mood influences prompt generation.
- Color Mood participates in batch generation if applicable.
- Existing style selections continue to work.

### Acceptance Criteria

- Different Color Moods produce visibly different palettes.
- Room type remains unchanged.
- Interior Design Style remains unchanged.
- Quality remains unchanged.

## Color Presence

### Goal

Allow users to control how strongly color appears in generated interiors.

### Control

Color Presence

Range:

0-100

Default:

25

### Levels

0-20
Muted

20-40
Subtle

40-60
Balanced

60-80
Expressive

80-100
Bold

### Behavior

The selected Color Mood determines the palette direction.

Color Presence determines how prominently colors appear.

Examples:

Warm Neutral + 25
= mostly neutrals with subtle accents

Warm Neutral + 75
= stronger sage, cognac, terracotta accents

Moody Luxury + 25
= dark neutrals with subtle brass

Moody Luxury + 75
= dramatic contrast and richer accents

### Acceptance Criteria

- Different Color Presence values produce visibly different results.
- Style remains unchanged.
- Room type remains unchanged.
- Color Mood remains unchanged.

## Acceptance Criteria

- Consecutive images show meaningful visual differences.
- Room type remains consistent.
- Selected design style remains consistent.
- Overall image quality remains unchanged.
- A batch of images should not all share the same dominant color palette.
- Color choices should feel intentional and professionally designed.
- Color palettes are appropriate to the selected design style.
- A generated batch should primarily contain warm neutrals, natural wood tones, stone textures, and designer-inspired palettes rather than blue or highly saturated walls.
