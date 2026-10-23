# Design System v1

## Style Direction

Premium AI Creative Tool

Inspired by:

- ChatGPT
- Linear
- Vercel
- Raycast

## Color System

Background:
#0F1115

Surface:
#171A21

Elevated Surface:
#1D2230

Border:
#262B36

Primary Text:
#F5F7FA

Secondary Text:
#98A2B3

Accent:
#4F8CFF

Success:
#22C55E

Error:
#EF4444

## Surface Layers and Buttons

Three surface levels keep controls visible against the card behind them:

- Card: #171A21 (section cards, nested panels)
- Raised control: #262B36 with a #3A4252 border (secondary buttons, unselected chips,
  intensity steps)
- Inset field: #0F1115 with a #3A4252 border (selects, text inputs)

A control must never use the same fill as the surface it sits on. Hover raises the fill to
#2D3342 and brightens the border to the accent. Disabled controls use 40% opacity.

## Section Tints

Each section card has a muted icon badge and a 3px left edge in its own tint, so a long page
is easy to scan. Tints are quiet and carry no meaning on their own; the title does.

- Saved setups: #8B9BB8
- Room: #C9A66B
- Look: #A08CD6
- Details: #5FB3A8
- Output: #8DB078
- Generate: #4F8CFF (the accent, as the primary action)

## Accent Usage

Accent color should only appear on:

- Selected cards
- Selected chips (accent border and a faint accent fill)
- Generate button
- Focus states
- Active tabs

Everything else remains neutral.

## Radius

Small: 10px
Medium: 16px
Large: 20px

## Shadows

Very subtle.

Avoid dramatic shadows.

## Typography

Headings:
600-700 weight

Body:
400-500 weight

Avoid excessive font sizes.

## Spacing

Use an 8px spacing system.

Examples:

8px
16px
24px
32px
48px

Avoid arbitrary spacing values.
