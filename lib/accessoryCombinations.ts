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

/** Keeps only known options for each group. An empty group means every option. */
export function resolveAccessoryOptions(raw: unknown): AccessoryOptions {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const resolved = createEmptyAccessoryOptions();

  for (const { key, options } of accessoryOptionGroups) {
    const requested = source[key];
    const valid = Array.isArray(requested)
      ? requested.filter((value): value is string => typeof value === "string" && options.includes(value))
      : [];

    resolved[key] = valid.length > 0 ? valid : options;
  }

  return resolved;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }

  return copy;
}

const SCENARIO_KEYS: Array<[keyof AccessoryScenario, keyof AccessoryOptions]> = [
  ["item", "items"],
  ["material", "materials"],
  ["setting", "settings"],
  ["lighting", "lighting"],
  ["framing", "framing"],
];

/**
 * Chooses `count` accessory scenarios. Each option group is shuffled and cycled on its own, so a group
 * with several options shows all of them before any repeats, and the groups vary independently.
 */
export function buildAccessoryScenarios(
  count: number,
  options: AccessoryOptions,
  random: () => number
): AccessoryScenario[] {
  const orders = Object.fromEntries(
    accessoryOptionGroups.map(({ key }) => [key, shuffled(options[key], random)])
  ) as Record<keyof AccessoryOptions, string[]>;

  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const scenario = {} as AccessoryScenario;

    for (const [field, group] of SCENARIO_KEYS) {
      const order = orders[group];
      scenario[field] = order[index % order.length] as string;
    }

    return scenario;
  });
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
