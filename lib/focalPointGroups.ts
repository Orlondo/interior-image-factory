import { focalPoints } from "./combinations";

/**
 * The focal point list is long, so the page shows it in headed sub-groups with a short label on
 * each chip. This is display only: the saved and generated value stays the full focal point text.
 *
 * Each entry matches a focal point by the start of its text, so the long strings are not retyped here.
 */
type Entry = { startsWith: string; label: string };

const GROUP_DEFINITIONS: Array<{ title: string; entries: Entry[] }> = [
  {
    title: "Statement walls",
    entries: [
      { startsWith: "dramatic raw material wall", label: "Raw material wall" },
      { startsWith: "monolithic single-material", label: "Single-material wall" },
      { startsWith: "floor-to-ceiling marble wall", label: "Marble wall" },
      { startsWith: "mirror tile wall", label: "Mirror tile wall" },
      { startsWith: "single large seamless full-height mirror", label: "Full mirror wall" },
      { startsWith: "TV wall", label: "TV wall" },
      { startsWith: "built-in wine wall", label: "Wine wall" },
    ],
  },
  {
    title: "Architecture",
    entries: [
      { startsWith: "asymmetrical architectural", label: "Asymmetrical intervention" },
      { startsWith: "radical geometric", label: "Geometric element" },
      { startsWith: "ceiling-as-canvas", label: "Ceiling as canvas" },
      { startsWith: "unexpected material juxtaposition", label: "Material juxtaposition" },
      { startsWith: "French doors", label: "French doors" },
      { startsWith: "indoor open-to-outdoor", label: "Indoor-outdoor living" },
    ],
  },
  {
    title: "Doorways & dividers",
    entries: [
      { startsWith: "wood-framed rectangular doorway", label: "Wood doorway" },
      { startsWith: "travertine-framed", label: "Travertine doorway" },
      { startsWith: "marble-framed curved", label: "Marble arched doorway" },
      { startsWith: "floor-to-ceiling room divider", label: "Storage divider wall" },
      { startsWith: "clear glass divider", label: "Glass divider" },
      { startsWith: "bookcase room divider", label: "Bookcase divider" },
      { startsWith: "metal divider wall", label: "Metal divider" },
    ],
  },
  {
    title: "Fireplaces",
    entries: [
      { startsWith: "bedroom fireplace", label: "Bedroom fireplace" },
      { startsWith: "kitchen fireplace as a backsplash", label: "Kitchen fireplace: backsplash" },
      { startsWith: "kitchen fireplace framed on the countertop", label: "Kitchen fireplace: countertop" },
      { startsWith: "kitchen fireplace integrated into the island", label: "Kitchen fireplace: island" },
    ],
  },
  {
    title: "Art & sculpture",
    entries: [
      { startsWith: "suspended or floating", label: "Floating sculpture" },
      { startsWith: "kinetic or light-based", label: "Kinetic or light art" },
      { startsWith: "oversized abstract art", label: "Abstract art or mural" },
      { startsWith: "minimalist conceptual", label: "Conceptual art piece" },
      { startsWith: "gallery wall of fall photography", label: "Fall photo gallery" },
      { startsWith: "gallery wall of framed photography", label: "Photo & print gallery" },
      { startsWith: "large architectural painting", label: "Architectural painting" },
      { startsWith: "mixed wall art", label: "Mixed wall art" },
    ],
  },
  {
    title: "Dining & kitchen",
    entries: [
      { startsWith: "large dining table with a cluster", label: "Table with flowers" },
      { startsWith: "dining table with a modern Thanksgiving", label: "Dinner table setting" },
      { startsWith: "kitchen countertop with everyday dinner", label: "Kitchen dinner styling" },
    ],
  },
  {
    title: "Plants & seasonal",
    entries: [
      { startsWith: "fall floral", label: "Fall floral arrangement" },
      { startsWith: "small indoor tree plants", label: "Autumn tree plants" },
      { startsWith: "small cluster of cactus", label: "Cactus cluster" },
      { startsWith: "small potted tree", label: "Potted tree" },
    ],
  },
  {
    title: "Curtains & lamps",
    entries: [
      { startsWith: "curtains with layered sheer", label: "Sheer & linen curtains" },
      { startsWith: "curtains with a soft Roman", label: "Roman shade curtains" },
      { startsWith: "curtains with a dramatic", label: "Velvet curtains" },
      { startsWith: "regular floor lamp", label: "Drum-shade floor lamp" },
      { startsWith: "hanging floor lamp", label: "Hanging floor lamp" },
    ],
  },
];

export type FocalPointSubGroup = {
  title: string;
  options: Array<{ value: string; label: string }>;
};

/** Focal points arranged for display. A focal point with no entry would land in "Other" so it is never hidden. */
export function buildFocalPointSubGroups(options: readonly string[] = focalPoints): FocalPointSubGroup[] {
  const used = new Set<string>();

  const groups = GROUP_DEFINITIONS.map((group) => ({
    title: group.title,
    options: group.entries.flatMap((entry) => {
      const value = options.find((option) => option.startsWith(entry.startsWith));

      if (!value || used.has(value)) {
        return [];
      }

      used.add(value);
      return [{ value, label: entry.label }];
    }),
  })).filter((group) => group.options.length > 0);

  const leftovers = options.filter((option) => !used.has(option));

  if (leftovers.length > 0) {
    groups.push({ title: "Other", options: leftovers.map((value) => ({ value, label: value })) });
  }

  return groups;
}
