export const accessoryItems = [
  "ceramic vase",
  "glass vase with fresh stems",
  "pendant light fixture",
  "table lamp",
  "wall sconce",
  "chandelier detail",
  "decorative bowl",
  "sculptural object",
  "candle holders with candles",
  "framed art print",
  "throw pillow and textured throw blanket",
  "decorative books and tray vignette",
  "cabinet hardware (pulls and knobs)",
  "faucet and sink fixture",
  "woven basket",
  "decorative mirror",
  "clock",
  "potted plant in a planter",
];

export const accessoryMaterials = [
  "matte ceramic",
  "hand-blown glass",
  "brushed brass",
  "polished chrome",
  "matte black metal",
  "natural travertine or marble",
  "raw wood",
  "woven rattan or jute",
  "linen and bouclé textile",
  "aged bronze",
];

export const accessorySettings = [
  "styled marble console surface",
  "wood dining table",
  "kitchen countertop",
  "bedside nightstand",
  "floating shelf",
  "fireplace mantel",
  "bathroom vanity",
  "entryway table",
  "plain studio backdrop",
];

export const accessoryLighting = [
  "soft natural window light",
  "warm evening lamp glow",
  "dramatic side light with soft shadows",
  "bright airy diffused light",
];

export const accessoryFraming = [
  "tight close-up of a single object",
  "macro detail shot emphasizing texture and material",
  "close-up with shallow depth of field and softly blurred room behind",
  "small styled vignette of two or three coordinated objects",
];

export type AccessoryOptions = {
  items: string[];
  materials: string[];
  settings: string[];
  lighting: string[];
  framing: string[];
};

export const accessoryOptionGroups: Array<{
  key: keyof AccessoryOptions;
  legend: string;
  allLabel: string;
  options: string[];
}> = [
  { key: "items", legend: "Accessory", allLabel: "All accessories", options: accessoryItems },
  { key: "materials", legend: "Material / finish", allLabel: "All materials", options: accessoryMaterials },
  { key: "settings", legend: "Surface / setting", allLabel: "All settings", options: accessorySettings },
  { key: "lighting", legend: "Lighting", allLabel: "All lighting", options: accessoryLighting },
  { key: "framing", legend: "Close-up framing", allLabel: "All framing", options: accessoryFraming },
];

export function createEmptyAccessoryOptions(): AccessoryOptions {
  return { items: [], materials: [], settings: [], lighting: [], framing: [] };
}

export type AccessoryScenario = {
  item: string;
  material: string;
  setting: string;
  lighting: string;
  framing: string;
};

export function buildAccessoryPrompt(
  scenario: AccessoryScenario,
  style: string,
  homeQuality: string,
  index: number,
  maxImages: number
): string {
  return `Photorealistic professional close-up product and interior-styling photograph of a home accessory.

Accessory direction:
- Subject: ${scenario.item}
- Material and finish: ${scenario.material}
- Placed on: ${scenario.setting}
- Design style: ${style}; quality level: ${homeQuality}
- Lighting: ${scenario.lighting}
- Framing: ${scenario.framing}

Rules:
- The accessory is the clear hero of the frame and fills most of it, with crisp focus, realistic materials, and true-to-life texture.
- Keep any background minimal and softly out of focus so it suggests a residential interior without showing the whole room.
- No people, no text or watermarks, no surreal elements.

Variation ${index + 1} of ${maxImages}.`;
}

export function buildAccessorySafetyFallbackPrompt(
  scenario: AccessoryScenario,
  index: number,
  maxImages: number
): string {
  return `Photorealistic close-up photograph of a ${scenario.material} ${scenario.item} on a ${scenario.setting}.
${scenario.lighting}; ${scenario.framing}.
Object only; no people.

Variation ${index + 1} of ${maxImages}.`;
}
