import { singleHeroColors } from "@/lib/combinations";
import type {
  ColorCoverage,
  ColorMood,
  ColorStrategy,
  HeroColor,
} from "@/lib/combinations";

export type PaletteVariant = {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  neutralBase: string;
  metalAccent: string;
  woodTone: string;
  complementaryAccents?: readonly string[];
};

export type SelectedPalette = PaletteVariant & {
  family: HeroColor;
  source: string;
};

export type ColorPreviewData = {
  paletteFamily: HeroColor;
  selectedPalette: string;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  colorIntensity: number;
  primary: string;
  secondary: string;
  complementaryAccent: string;
  neutralGrounding: string;
  woodTone: string;
  metalFinish: string;
  variationNumber: number;
  variationTotal: number;
};

type PaletteStory = {
  primary: string;
  secondary: string;
  complementaryAccent: string;
  neutralGrounding: string;
  woodTone: string;
  metalFinish: string;
  contrastTone: string;
};

const MAJOR_SURFACES =
  "walls, cabinetry, built-ins, fireplace surrounds, millwork, shelving, and ceiling details";

// "Mixed" is the one legacy hero color value that is not a current option.
const LEGACY_TO_FAMILY_MAP: Record<string, HeroColor> = {
  Mixed: "Designer Mixed",
};

const COMPLEMENTARY_COLOR_MAP: Record<string, readonly string[]> = {
  sage: ["terracotta", "rust", "clay", "muted blush", "ochre", "warm brass"],
  olive: ["clay", "burgundy", "cream", "dark bronze", "muted gold"],
  terracotta: ["sage", "olive", "cream", "charcoal", "aged brass"],
  navy: ["camel", "rust", "brass", "ivory", "walnut"],
  teal: ["ochre", "gold", "sand", "walnut", "cream"],
  burgundy: ["blush", "cream", "olive", "walnut", "brass"],
};

const FAMILY_PALETTES: Record<HeroColor, readonly PaletteVariant[]> = {
  Auto: [
    {
      name: "Sage, Stone, Walnut",
      primary: "sage",
      secondary: "olive",
      tertiary: "warm stone",
      neutralBase: "ivory and light limestone",
      metalAccent: "brushed brass",
      woodTone: "natural walnut",
    },
    {
      name: "Terracotta, Cream, Oak",
      primary: "terracotta",
      secondary: "clay rose",
      tertiary: "burnt sienna",
      neutralBase: "cream and travertine",
      metalAccent: "aged bronze",
      woodTone: "white oak",
    },
    {
      name: "Teal, Charcoal, Brass",
      primary: "teal",
      secondary: "ink blue",
      tertiary: "charcoal",
      neutralBase: "warm white and stone",
      metalAccent: "soft brass",
      woodTone: "smoked oak",
    },
    {
      name: "Plum, Taupe, Gold",
      primary: "dusty plum",
      secondary: "aubergine",
      tertiary: "warm taupe",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
  ],
  "Designer Mixed": [
    {
      name: "Olive, Walnut, Brass",
      primary: "olive",
      secondary: "sage",
      tertiary: "warm sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Terracotta, Cream, Walnut",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "soft rust",
      neutralBase: "cream and travertine",
      metalAccent: "antique brass",
      woodTone: "walnut",
    },
    {
      name: "Teal, Stone, Bronze",
      primary: "deep teal",
      secondary: "blue-green",
      tertiary: "warm gray",
      neutralBase: "stone and ivory",
      metalAccent: "bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Charcoal, Gold, Oat",
      primary: "warm charcoal",
      secondary: "graphite",
      tertiary: "muted olive",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
    {
      name: "Navy, Clay, Linen",
      primary: "deep navy",
      secondary: "dusty blue",
      tertiary: "clay",
      neutralBase: "linen and warm white",
      metalAccent: "soft brass",
      woodTone: "white oak",
    },
    {
      name: "Plum, Moss, Stone",
      primary: "dusty plum",
      secondary: "moss",
      tertiary: "cocoa",
      neutralBase: "pale stone and ivory",
      metalAccent: "aged bronze",
      woodTone: "walnut",
    },
  ],
  "Earthy Mixed": [
    {
      name: "Sage, Oak, Sand",
      primary: "sage",
      secondary: "olive",
      tertiary: "sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed bronze",
      woodTone: "natural oak",
    },
    {
      name: "Olive, Walnut, Stone",
      primary: "olive",
      secondary: "moss",
      tertiary: "warm stone",
      neutralBase: "travertine and oat",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Terracotta, Clay, Cream",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "rust",
      neutralBase: "cream and linen",
      metalAccent: "antique brass",
      woodTone: "smoked oak",
    },
    {
      name: "Rust, Walnut, Taupe",
      primary: "rust",
      secondary: "burnt sienna",
      tertiary: "cinnamon",
      neutralBase: "taupe and warm putty",
      metalAccent: "bronze",
      woodTone: "dark walnut",
    },
    {
      name: "Clay, Olive, Travertine",
      primary: "clay",
      secondary: "olive",
      tertiary: "dusty terracotta",
      neutralBase: "travertine and cream",
      metalAccent: "soft bronze",
      woodTone: "walnut",
    },
    {
      name: "Walnut, Moss, Oat",
      primary: "moss",
      secondary: "olive",
      tertiary: "cocoa",
      neutralBase: "oat and ivory",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
  ],
  "Jewel Tone Mixed": [
    {
      name: "Emerald, Charcoal, Gold",
      primary: "emerald",
      secondary: "deep green",
      tertiary: "charcoal",
      neutralBase: "warm stone",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
    {
      name: "Navy, Brass, Cocoa",
      primary: "navy",
      secondary: "ink blue",
      tertiary: "espresso",
      neutralBase: "oat and stone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Teal, Bronze, Linen",
      primary: "teal",
      secondary: "petrol blue",
      tertiary: "moss",
      neutralBase: "linen and pale stone",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Plum, Gold, Taupe",
      primary: "plum",
      secondary: "aubergine",
      tertiary: "warm taupe",
      neutralBase: "ivory and putty",
      metalAccent: "soft gold",
      woodTone: "walnut",
    },
    {
      name: "Gold, Charcoal, Olive",
      primary: "gold ochre",
      secondary: "amber",
      tertiary: "olive",
      neutralBase: "warm gray and stone",
      metalAccent: "brushed bronze",
      woodTone: "dark oak",
    },
    {
      name: "Emerald, Navy, Bronze",
      primary: "emerald",
      secondary: "navy",
      tertiary: "deep teal",
      neutralBase: "warm stone",
      metalAccent: "bronze",
      woodTone: "walnut",
    },
  ],
  "Warm Mixed": [
    {
      name: "Terracotta, Cream, Walnut",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "dusty rust",
      neutralBase: "cream and travertine",
      metalAccent: "antique brass",
      woodTone: "walnut",
    },
    {
      name: "Rust, Stone, Bronze",
      primary: "rust",
      secondary: "burnt orange",
      tertiary: "cinnamon",
      neutralBase: "warm stone and oat",
      metalAccent: "bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Clay, Ivory, Brass",
      primary: "clay",
      secondary: "copper rose",
      tertiary: "dusty peach",
      neutralBase: "ivory and putty",
      metalAccent: "brushed brass",
      woodTone: "white oak",
    },
    {
      name: "Mustard, Taupe, Walnut",
      primary: "mustard",
      secondary: "ochre",
      tertiary: "olive",
      neutralBase: "taupe and cream",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Sienna, Sand, Bronze",
      primary: "sienna",
      secondary: "terracotta",
      tertiary: "dusty rose",
      neutralBase: "sand and ivory",
      metalAccent: "bronze",
      woodTone: "oak",
    },
    {
      name: "Rose Clay, Oat, Brass",
      primary: "rose clay",
      secondary: "dusty coral",
      tertiary: "cinnamon",
      neutralBase: "oat and cream",
      metalAccent: "soft brass",
      woodTone: "walnut",
    },
  ],
  "Cool Mixed": [
    {
      name: "Teal, Stone, Brass",
      primary: "teal",
      secondary: "sea green",
      tertiary: "slate",
      neutralBase: "warm white and stone",
      metalAccent: "satin brass",
      woodTone: "light oak",
    },
    {
      name: "Navy, Charcoal, Gold",
      primary: "navy",
      secondary: "ink blue",
      tertiary: "warm charcoal",
      neutralBase: "ivory and limestone",
      metalAccent: "muted gold",
      woodTone: "walnut",
    },
    {
      name: "Slate Blue, Oat, Bronze",
      primary: "slate blue",
      secondary: "dusty blue",
      tertiary: "charcoal",
      neutralBase: "oat and pale stone",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Eucalyptus, Ivory, Brass",
      primary: "eucalyptus",
      secondary: "sage",
      tertiary: "soft teal",
      neutralBase: "ivory and linen",
      metalAccent: "soft brass",
      woodTone: "white oak",
    },
    {
      name: "Deep Blue, Sand, Walnut",
      primary: "deep blue",
      secondary: "petrol",
      tertiary: "muted olive",
      neutralBase: "sand and warm stone",
      metalAccent: "bronze",
      woodTone: "walnut",
    },
    {
      name: "Graphite, Teal, Gold",
      primary: "graphite",
      secondary: "deep teal",
      tertiary: "ink blue",
      neutralBase: "warm gray and oat",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
  ],
  "Monochrome": [
    {
      name: "Greige Tonal",
      primary: "warm greige",
      secondary: "soft taupe",
      tertiary: "deep mushroom",
      neutralBase: "pale oat",
      metalAccent: "brushed nickel",
      woodTone: "pale oak",
      complementaryAccents: ["bone", "pale stone", "deep mushroom", "soft taupe"],
    },
    {
      name: "Sage Tonal",
      primary: "soft sage",
      secondary: "mid green-gray",
      tertiary: "deep moss-gray",
      neutralBase: "pale celadon white",
      metalAccent: "matte pewter",
      woodTone: "pale ash",
      complementaryAccents: ["pale celadon", "mid green-gray", "deep moss-gray", "bone"],
    },
    {
      name: "Blue-Gray Tonal",
      primary: "fog blue-gray",
      secondary: "slate blue-gray",
      tertiary: "deep ink-gray",
      neutralBase: "pale mist",
      metalAccent: "brushed steel",
      woodTone: "bleached oak",
      complementaryAccents: ["pale mist", "slate blue-gray", "deep ink-gray", "bone"],
    },
    {
      name: "Warm Sand Tonal",
      primary: "pale sand",
      secondary: "camel-beige",
      tertiary: "deep cocoa-beige",
      neutralBase: "cream",
      metalAccent: "soft champagne brass",
      woodTone: "natural oak",
      complementaryAccents: ["cream", "camel-beige", "deep cocoa-beige", "bone"],
    },
  ],
  "Pastel Mixed": [
    {
      name: "Blush, Mint, Cream",
      primary: "powdery blush",
      secondary: "soft mint",
      tertiary: "butter yellow",
      neutralBase: "creamy off-white",
      metalAccent: "pale champagne",
      woodTone: "bleached oak",
      complementaryAccents: ["butter yellow", "soft lilac", "pale sky blue", "cream"],
    },
    {
      name: "Lilac, Sky, Ivory",
      primary: "soft lilac",
      secondary: "pale sky blue",
      tertiary: "pale peach",
      neutralBase: "ivory",
      metalAccent: "pale brass",
      woodTone: "light ash",
      complementaryAccents: ["pale peach", "soft mint", "butter yellow", "ivory"],
    },
    {
      name: "Butter, Sage, Shell",
      primary: "butter yellow",
      secondary: "pale sage",
      tertiary: "shell pink",
      neutralBase: "warm white",
      metalAccent: "soft brass",
      woodTone: "light oak",
      complementaryAccents: ["shell pink", "powdery blue", "soft lilac", "warm white"],
    },
    {
      name: "Peach, Powder Blue, Cream",
      primary: "pale peach",
      secondary: "powder blue",
      tertiary: "soft mint",
      neutralBase: "cream",
      metalAccent: "brushed gold",
      woodTone: "pale beech",
      complementaryAccents: ["powder blue", "soft lilac", "butter yellow", "cream"],
    },
  ],
  "Vivid Mixed": [
    {
      name: "Cobalt, Tangerine, Cream",
      primary: "cobalt blue",
      secondary: "tangerine",
      tertiary: "saffron",
      neutralBase: "warm white",
      metalAccent: "polished brass",
      woodTone: "walnut",
      complementaryAccents: ["tangerine", "magenta", "emerald", "cream"],
    },
    {
      name: "Magenta, Emerald, Ivory",
      primary: "magenta",
      secondary: "emerald",
      tertiary: "saffron",
      neutralBase: "ivory",
      metalAccent: "antique brass",
      woodTone: "dark walnut",
      complementaryAccents: ["emerald", "cobalt blue", "tangerine", "ivory"],
    },
    {
      name: "Saffron, Teal, Fuchsia",
      primary: "saffron",
      secondary: "vivid teal",
      tertiary: "fuchsia",
      neutralBase: "cream",
      metalAccent: "gold",
      woodTone: "natural teak",
      complementaryAccents: ["fuchsia", "cobalt blue", "tangerine", "cream"],
    },
    {
      name: "Poppy, Cobalt, Chartreuse",
      primary: "poppy red",
      secondary: "cobalt blue",
      tertiary: "chartreuse",
      neutralBase: "soft white",
      metalAccent: "polished nickel",
      woodTone: "white oak",
      complementaryAccents: ["chartreuse", "magenta", "saffron", "soft white"],
    },
  ],
  "Slate & Steel": [
    {
      name: "Slate, Fog, White",
      primary: "slate gray",
      secondary: "fog gray",
      tertiary: "icy blue",
      neutralBase: "clean white",
      metalAccent: "brushed steel",
      woodTone: "pale ash",
      complementaryAccents: ["icy blue", "graphite", "pale silver", "white"],
    },
    {
      name: "Graphite, Steel Blue, Pale Gray",
      primary: "graphite",
      secondary: "steel blue",
      tertiary: "pale gray",
      neutralBase: "cool white",
      metalAccent: "polished chrome",
      woodTone: "bleached oak",
      complementaryAccents: ["steel blue", "icy blue", "pale silver", "white"],
    },
    {
      name: "Charcoal, Ice, Silver",
      primary: "charcoal",
      secondary: "ice blue",
      tertiary: "silver gray",
      neutralBase: "crisp white",
      metalAccent: "satin nickel",
      woodTone: "light cool oak",
      complementaryAccents: ["ice blue", "slate gray", "pale silver", "white"],
    },
    {
      name: "Blue-Gray, Concrete, Cloud",
      primary: "blue-gray",
      secondary: "concrete gray",
      tertiary: "cloud white",
      neutralBase: "cool off-white",
      metalAccent: "blackened steel",
      woodTone: "pale cool oak",
      complementaryAccents: ["concrete gray", "icy blue", "graphite", "white"],
    },
  ],
  "Dark Earthy Mixed": [
    {
      name: "Espresso, Forest, Leather",
      primary: "espresso brown",
      secondary: "forest green",
      tertiary: "aged leather tan",
      neutralBase: "warm stone",
      metalAccent: "aged bronze",
      woodTone: "dark walnut",
      complementaryAccents: ["aged leather tan", "charcoal-olive", "burnt umber", "warm stone"],
    },
    {
      name: "Umber, Charcoal-Olive, Cognac",
      primary: "burnt umber",
      secondary: "charcoal-olive",
      tertiary: "cognac",
      neutralBase: "putty",
      metalAccent: "dark bronze",
      woodTone: "smoked oak",
      complementaryAccents: ["cognac", "forest green", "espresso brown", "putty"],
    },
    {
      name: "Deep Moss, Chocolate, Brass",
      primary: "deep moss green",
      secondary: "chocolate brown",
      tertiary: "tobacco",
      neutralBase: "warm taupe",
      metalAccent: "antique brass",
      woodTone: "dark oak",
      complementaryAccents: ["tobacco", "burnt umber", "aged leather tan", "warm taupe"],
    },
    {
      name: "Forest, Walnut, Rust",
      primary: "forest green",
      secondary: "dark walnut",
      tertiary: "deep rust",
      neutralBase: "oat and putty",
      metalAccent: "aged brass",
      woodTone: "dark walnut",
      complementaryAccents: ["deep rust", "cognac", "charcoal-olive", "oat"],
    },
  ],
  "Deep Blue": [
    {
      name: "Deep Blue, Ivory, Walnut",
      primary: "deep navy blue",
      secondary: "ink blue",
      tertiary: "warm gray",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Navy, Cream, Oak",
      primary: "navy",
      secondary: "slate blue",
      tertiary: "camel",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "white oak",
    },
    {
      name: "Midnight Blue, Stone, Smoked Oak",
      primary: "midnight blue",
      secondary: "dusty blue",
      tertiary: "charcoal",
      neutralBase: "warm white and stone",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
    },
  ],
  Teal: [
    {
      name: "Teal, Sand, Walnut",
      primary: "teal",
      secondary: "deep petrol",
      tertiary: "warm sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Peacock Teal, Cream, Oak",
      primary: "peacock teal",
      secondary: "ink blue",
      tertiary: "ochre",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "white oak",
    },
    {
      name: "Dark Teal, Charcoal, Gold",
      primary: "deep teal",
      secondary: "forest green",
      tertiary: "charcoal",
      neutralBase: "warm white and stone",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
  ],
  Emerald: [
    {
      name: "Emerald, Ivory, Walnut",
      primary: "emerald green",
      secondary: "forest green",
      tertiary: "warm stone",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
      complementaryAccents: ["blush", "cream", "rust", "walnut", "brass"],
    },
    {
      name: "Emerald, Blush, Oak",
      primary: "emerald",
      secondary: "deep jade",
      tertiary: "muted blush",
      neutralBase: "cream and travertine",
      metalAccent: "soft gold",
      woodTone: "white oak",
      complementaryAccents: ["blush", "cream", "rust", "walnut", "brass"],
    },
    {
      name: "Jewel Emerald, Charcoal, Bronze",
      primary: "jewel emerald",
      secondary: "dark green",
      tertiary: "charcoal",
      neutralBase: "warm white and plaster",
      metalAccent: "aged bronze",
      woodTone: "dark walnut",
      complementaryAccents: ["blush", "cream", "rust", "walnut", "brass"],
    },
  ],
  Olive: [
    {
      name: "Olive, Sand, Walnut",
      primary: "olive green",
      secondary: "moss",
      tertiary: "warm sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Olive, Cream, Oak",
      primary: "olive",
      secondary: "sage",
      tertiary: "clay",
      neutralBase: "cream and travertine",
      metalAccent: "aged bronze",
      woodTone: "white oak",
    },
    {
      name: "Deep Olive, Charcoal, Gold",
      primary: "deep olive",
      secondary: "forest green",
      tertiary: "warm charcoal",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
  ],
  Sage: [
    {
      name: "Sage, Ivory, Oak",
      primary: "sage green",
      secondary: "eucalyptus",
      tertiary: "warm white",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "white oak",
    },
    {
      name: "Sage, Clay, Walnut",
      primary: "sage",
      secondary: "soft olive",
      tertiary: "clay rose",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Gray Sage, Stone, Smoked Oak",
      primary: "gray-green sage",
      secondary: "deep sage",
      tertiary: "warm taupe",
      neutralBase: "warm white and stone",
      metalAccent: "soft bronze",
      woodTone: "smoked oak",
    },
  ],
  Terracotta: [
    {
      name: "Terracotta, Cream, Walnut",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "soft rust",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Burnt Terracotta, Sand, Oak",
      primary: "burnt terracotta",
      secondary: "warm sienna",
      tertiary: "sand",
      neutralBase: "ivory and limestone",
      metalAccent: "aged bronze",
      woodTone: "white oak",
    },
    {
      name: "Deep Terracotta, Charcoal, Brass",
      primary: "deep terracotta",
      secondary: "rust",
      tertiary: "warm charcoal",
      neutralBase: "cream and plaster",
      metalAccent: "brushed brass",
      woodTone: "dark walnut",
    },
  ],
  Rust: [
    {
      name: "Rust, Cream, Walnut",
      primary: "rust",
      secondary: "burnt orange",
      tertiary: "warm tan",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Rust, Olive, Oak",
      primary: "rust",
      secondary: "olive",
      tertiary: "camel",
      neutralBase: "ivory and limestone",
      metalAccent: "aged bronze",
      woodTone: "white oak",
    },
    {
      name: "Deep Rust, Charcoal, Gold",
      primary: "deep rust",
      secondary: "copper",
      tertiary: "warm charcoal",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
  ],
  Burgundy: [
    {
      name: "Burgundy, Cream, Walnut",
      primary: "burgundy",
      secondary: "merlot",
      tertiary: "warm blush",
      neutralBase: "cream and travertine",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Wine, Olive, Oak",
      primary: "wine red",
      secondary: "dusty mauve",
      tertiary: "olive",
      neutralBase: "ivory and limestone",
      metalAccent: "aged brass",
      woodTone: "white oak",
    },
    {
      name: "Deep Burgundy, Charcoal, Gold",
      primary: "deep burgundy",
      secondary: "oxblood",
      tertiary: "warm charcoal",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
  ],
  Plum: [
    {
      name: "Plum, Taupe, Walnut",
      primary: "dusty plum",
      secondary: "aubergine",
      tertiary: "warm taupe",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "walnut",
    },
    {
      name: "Plum, Olive, Oak",
      primary: "plum",
      secondary: "mauve",
      tertiary: "olive",
      neutralBase: "cream and limestone",
      metalAccent: "aged brass",
      woodTone: "white oak",
    },
    {
      name: "Deep Aubergine, Stone, Smoked Oak",
      primary: "deep aubergine",
      secondary: "plum",
      tertiary: "charcoal",
      neutralBase: "warm white and stone",
      metalAccent: "soft bronze",
      woodTone: "smoked oak",
    },
  ],
  Mustard: [
    {
      name: "Mustard, Cream, Walnut",
      primary: "mustard yellow",
      secondary: "ochre",
      tertiary: "warm brown",
      neutralBase: "cream and travertine",
      metalAccent: "aged brass",
      woodTone: "walnut",
      complementaryAccents: ["deep navy", "olive", "cream", "walnut", "charcoal"],
    },
    {
      name: "Mustard, Navy, Oak",
      primary: "mustard",
      secondary: "deep navy",
      tertiary: "camel",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "white oak",
      complementaryAccents: ["deep navy", "olive", "cream", "walnut", "charcoal"],
    },
    {
      name: "Golden Mustard, Olive, Smoked Oak",
      primary: "golden mustard",
      secondary: "olive",
      tertiary: "warm charcoal",
      neutralBase: "oat and putty",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
      complementaryAccents: ["deep navy", "olive", "cream", "walnut", "charcoal"],
    },
  ],
  Gold: [
    {
      name: "Gold, Ivory, Walnut",
      primary: "antique gold",
      secondary: "warm champagne",
      tertiary: "soft taupe",
      neutralBase: "ivory and limestone",
      metalAccent: "polished brass",
      woodTone: "walnut",
      complementaryAccents: ["deep navy", "burgundy", "cream", "charcoal", "walnut"],
    },
    {
      name: "Gold, Charcoal, Oak",
      primary: "gold",
      secondary: "amber",
      tertiary: "charcoal",
      neutralBase: "cream and travertine",
      metalAccent: "brushed brass",
      woodTone: "white oak",
      complementaryAccents: ["deep navy", "burgundy", "cream", "charcoal", "walnut"],
    },
    {
      name: "Deep Gold, Navy, Dark Walnut",
      primary: "deep gold",
      secondary: "bronze",
      tertiary: "deep navy",
      neutralBase: "warm white and stone",
      metalAccent: "aged gold",
      woodTone: "dark walnut",
      complementaryAccents: ["deep navy", "burgundy", "cream", "charcoal", "walnut"],
    },
  ],
};

function clampColorIntensity(colorIntensity: number): number {
  if (!Number.isFinite(colorIntensity)) {
    return 25;
  }

  return Math.max(0, Math.min(100, Math.round(colorIntensity)));
}

function getHueKey(value: string): keyof typeof COMPLEMENTARY_COLOR_MAP | null {
  const lower = value.toLowerCase();

  if (lower.includes("sage")) {
    return "sage";
  }

  if (lower.includes("olive") || lower.includes("moss") || lower.includes("eucalyptus")) {
    return "olive";
  }

  if (
    lower.includes("terracotta") ||
    lower.includes("clay") ||
    lower.includes("rust") ||
    lower.includes("sienna")
  ) {
    return "terracotta";
  }

  if (lower.includes("teal") || lower.includes("petrol")) {
    return "teal";
  }

  if (lower.includes("navy") || lower.includes("deep blue") || lower.includes("ink blue")) {
    return "navy";
  }

  if (lower.includes("burgundy") || lower.includes("plum") || lower.includes("aubergine")) {
    return "burgundy";
  }

  return null;
}

function buildPaletteStory(
  palette: SelectedPalette,
  imageIndex: number,
  autoPaletteVariation: boolean
): PaletteStory {
  const primary = palette.primary;
  const secondary = palette.secondary;
  const neutralGrounding = palette.neutralBase;
  const woodTone = palette.woodTone;
  const metalFinish = palette.metalAccent;
  const contrastTone = palette.tertiary;

  const hueKey = getHueKey(primary) ?? getHueKey(secondary);
  const complementaryCandidates =
    palette.complementaryAccents ||
    (hueKey && COMPLEMENTARY_COLOR_MAP[hueKey]) ||
    ["soft charcoal", "terracotta", "muted ochre", "aged brass", "warm ivory"];

  const complementaryIndex = autoPaletteVariation
    ? imageIndex % complementaryCandidates.length
    : 0;

  const complementaryAccent = complementaryCandidates[complementaryIndex] ?? complementaryCandidates[0] ?? "soft charcoal";

  return {
    primary,
    secondary,
    complementaryAccent,
    neutralGrounding,
    woodTone,
    metalFinish,
    contrastTone,
  };
}

function shouldUseLegacyNeutralGuardrails(input: {
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  colorIntensity: number;
}): boolean {
  return (
    input.colorStrategy === "Neutral Base" ||
    input.colorCoverage === "Decor Only"
  );
}

function normalizePaletteFamily(heroColor: HeroColor | string): HeroColor {
  if (heroColor in FAMILY_PALETTES) {
    return heroColor as HeroColor;
  }

  return LEGACY_TO_FAMILY_MAP[heroColor] ?? "Auto";
}

function getMoodDefaultFamily(colorMood: ColorMood): HeroColor {
  switch (colorMood) {
    case "Organic Earthy":
      return "Earthy Mixed";
    case "Light & Airy":
      return "Cool Mixed";
    case "Moody Luxury":
      return "Jewel Tone Mixed";
    case "Coastal Neutral":
      return "Cool Mixed";
    case "Monochrome Tonal":
      return "Monochrome";
    case "Soft Pastel":
      return "Pastel Mixed";
    case "Vivid Eclectic":
      return "Vivid Mixed";
    case "Cool Modern":
      return "Slate & Steel";
    case "Dark Earthy":
      return "Dark Earthy Mixed";
    default:
      return "Designer Mixed";
  }
}

function getCoverageDirective(colorCoverage: ColorCoverage): string {
  switch (colorCoverage) {
    case "Decor Only":
      return "Coverage Decor Only: keep color in decor and accessories.";
    case "Softly Distributed":
      return "Coverage Softly Distributed: color should appear in decor, textiles, and furniture.";
    case "Architectural Surfaces":
      return `Coverage Architectural Surfaces: at least one major surface must carry palette color (${MAJOR_SURFACES}).`;
    case "Whole Room":
      return `Coverage Whole Room: multiple major surfaces must carry palette color (${MAJOR_SURFACES}).`;
  }
}

export function selectPalette(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  heroColor: HeroColor;
  imageIndex: number;
  autoPaletteVariation: boolean;
}): SelectedPalette {
  const requestedFamily = normalizePaletteFamily(input.heroColor);
  const family =
    requestedFamily === "Auto" ? getMoodDefaultFamily(input.colorMood) : requestedFamily;
  const pool = FAMILY_PALETTES[family];
  const index = input.autoPaletteVariation ? input.imageIndex % pool.length : 0;
  const base = pool[index] ?? pool[0];

  return {
    ...base,
    family,
    source: `${input.colorMood} mood + ${input.colorStrategy} strategy + ${family} palette family`,
  };
}

export function getIntensityDirective(colorIntensity: number): string {
  const intensity = clampColorIntensity(colorIntensity);

  if (intensity <= 10) {
    return `Color intensity ${intensity}/100: very muted. Every palette role (primary, secondary, complementary accent, neutral grounding, wood, and metal) is present only as a quiet, desaturated, low-contrast tone. Intensity sets the strength of color and overrides coverage: no saturated color on any surface or large piece.`;
  }

  if (intensity <= 20) {
    return `Color intensity ${intensity}/100: muted and restrained. Keep all palette roles present, but as soft, desaturated tones. Intensity sets the strength of color and overrides coverage: surfaces carry only pale tints of the palette, and stronger color is limited to small accents.`;
  }

  if (intensity <= 50) {
    return `Color intensity ${intensity}/100: balanced palette distribution across furniture, textiles, and selected surfaces.`;
  }

  if (intensity <= 80) {
    return `Color intensity ${intensity}/100: expressive palette distribution across architecture and furnishings.`;
  }

  return `Color intensity ${intensity}/100: strong designer palette with clear room-wide continuity and visible complementary accents.`;
}

export function getStrategyDirective(
  colorStrategy: ColorStrategy,
  colorIntensity: number,
  colorCoverage: ColorCoverage
): string {
  const intensity = clampColorIntensity(colorIntensity);
  const useNeutralGuardrails = shouldUseLegacyNeutralGuardrails({
    colorStrategy,
    colorCoverage,
    colorIntensity: intensity,
  });

  if (colorStrategy === "Neutral Base") {
    return "Strategy Neutral Base: neutral-led room with only subtle color support.";
  }

  if (colorStrategy === "Gallery Inspired") {
    return "Strategy Gallery Inspired: derive palette from artwork and repeat it across architecture, furniture, textiles, and decor.";
  }

  if (colorStrategy === "Color Drenched") {
    return "Strategy Color Drenched: spread palette color across major surfaces with curated upscale restraint.";
  }

  if (colorStrategy === "Accent Color") {
    return "Strategy Accent Color: keep one dominant primary color and one clear complementary accent color visible. Accent Color does not mean single-color output.";
  }

  if (useNeutralGuardrails) {
    return `Strategy ${colorStrategy}: keep color controlled while preserving palette cohesion.`;
  }

  return `Strategy ${colorStrategy}: strategy overrides mood when conflicts appear; avoid neutral defaults unless explicitly requested.`;
}

function getArchitecturalSurfaceDirective(
  colorStrategy: ColorStrategy,
  colorCoverage: ColorCoverage,
  colorIntensity: number,
  palette: SelectedPalette
): string {
  const intensity = clampColorIntensity(colorIntensity);

  const base = `Apply palette across walls, cabinetry, millwork, built-ins, rugs, furniture, and artwork with coherent tonal balance from ${palette.name}.`;

  if (colorStrategy === "Gallery Inspired") {
    const galleryRule =
      intensity > 75
        ? `Gallery rule: because intensity is ${intensity}, at least two major architectural surfaces must carry artwork-derived palette colors.`
        : intensity > 50
          ? `Gallery rule: because intensity is ${intensity}, at least one major architectural surface must carry artwork-derived palette colors.`
          : "Gallery rule: carry artwork tones into textiles, furniture, and one subtle architectural echo.";

    return `${base} Derive the color sequence from a large artwork and echo those tones through architecture, not just decor. ${galleryRule}`;
  }

  if (colorCoverage === "Decor Only") {
    return `${base} Keep architecture restrained; prioritize decor and accessories.`;
  }

  if (colorCoverage === "Softly Distributed") {
    return `${base} Distribute color through decor, textiles, and furniture with only subtle architectural support.`;
  }

  const lowIntensitySuffix =
    intensity <= 20
      ? " Because intensity is low, render that surface color as a pale, desaturated, tonal tint rather than a saturated paint color."
      : "";

  if (colorCoverage === "Architectural Surfaces") {
    return `${base} Require at least one major surface in palette color, beyond decor-only behavior.${lowIntensitySuffix}`;
  }

  return `${base} Require multiple major surfaces in palette color so the room reads as a full-room composition.${lowIntensitySuffix}`;
}

function getPaletteCohesionDirective(
  autoPaletteVariation: boolean,
  imageIndex: number,
  maxImages: number
): string {
  if (!autoPaletteVariation || maxImages <= 1) {
    return "Keep one cohesive palette per request while allowing tonal depth and material variation.";
  }

  const sequence = (imageIndex % Math.max(1, maxImages)) + 1;
  return `Variation ${sequence}/${maxImages}: maintain palette-family cohesion while allowing controlled variation, tonal exploration, and palette evolution across the batch.`;
}

export function getHeroColorDirective(heroColor: HeroColor, palette: SelectedPalette): string {
  const family = normalizePaletteFamily(heroColor);

  if (family === "Auto") {
    return `Palette family Auto: use the mood-curated family ${palette.family} with balanced color leadership.`;
  }

  if ((singleHeroColors as readonly string[]).includes(family)) {
    return `Hero color ${family}: make ${palette.primary} the clear lead color and repeat it deliberately through artwork, textiles, furniture accents, decor, and architectural details so it reads as an intentional designer choice, supported by ${palette.secondary} and ${palette.neutralBase}.`;
  }

  if (family === "Monochrome") {
    return `Palette family Monochrome: keep the whole room in one hue family, using ${palette.primary} as the lead tone with ${palette.secondary} and ${palette.tertiary} as lighter and deeper values of the same hue; vary texture and material, not hue.`;
  }

  return `Palette family ${family}: influence this variation with layered primary, secondary, complementary accent, and contrast tones without forcing a single-color room.`;
}

export function generatePaletteVariation(
  palette: SelectedPalette,
  input: {
    colorStrategy: ColorStrategy;
    autoPaletteVariation: boolean;
    imageIndex: number;
    maxImages: number;
  }
): string {
  const sequencePosition = (input.imageIndex % Math.max(1, input.maxImages)) + 1;

  if (!input.autoPaletteVariation || input.maxImages <= 1) {
    return `Variation ${sequencePosition}/${input.maxImages}: keep ${palette.name} as the anchor palette with nuanced material and tonal changes.`;
  }

  return `Variation ${sequencePosition}/${input.maxImages}: rotate both primary and complementary accent colors through ${palette.family} while preserving ${input.colorStrategy} strategy intent.`;
}

export function getColorPreviewData(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  imageIndex: number;
  maxImages: number;
}): ColorPreviewData {
  const palette = selectPalette({
    colorMood: input.colorMood,
    colorStrategy: input.colorStrategy,
    heroColor: input.heroColor,
    imageIndex: input.autoPaletteVariation ? input.imageIndex : 0,
    autoPaletteVariation: input.autoPaletteVariation,
  });

  const paletteStory = buildPaletteStory(
    palette,
    input.autoPaletteVariation ? input.imageIndex : 0,
    input.autoPaletteVariation
  );

  return {
    paletteFamily: palette.family,
    selectedPalette: palette.name,
    colorStrategy: input.colorStrategy,
    colorCoverage: input.colorCoverage,
    colorIntensity: clampColorIntensity(input.colorIntensity),
    primary: paletteStory.primary,
    secondary: paletteStory.secondary,
    complementaryAccent: paletteStory.complementaryAccent,
    neutralGrounding: paletteStory.neutralGrounding,
    woodTone: paletteStory.woodTone,
    metalFinish: paletteStory.metalFinish,
    variationNumber: (input.imageIndex % Math.max(1, input.maxImages)) + 1,
    variationTotal: Math.max(1, input.maxImages),
  };
}

export function buildColorPaletteDirective(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  imageIndex: number;
  maxImages: number;
  style: string;
}): string {
  const palette = selectPalette({
    colorMood: input.colorMood,
    colorStrategy: input.colorStrategy,
    heroColor: input.heroColor,
    imageIndex: input.autoPaletteVariation ? input.imageIndex : 0,
    autoPaletteVariation: input.autoPaletteVariation,
  });

  const paletteStory = buildPaletteStory(
    palette,
    input.autoPaletteVariation ? input.imageIndex : 0,
    input.autoPaletteVariation
  );

  const strategyDirective = getStrategyDirective(
    input.colorStrategy,
    input.colorIntensity,
    input.colorCoverage
  );
  const intensityDirective = getIntensityDirective(input.colorIntensity);
  const heroDirective = getHeroColorDirective(input.heroColor, palette);
  const coverageNeedsTint =
    input.colorCoverage === "Architectural Surfaces" || input.colorCoverage === "Whole Room";
  const coverageDirective =
    clampColorIntensity(input.colorIntensity) <= 20 && coverageNeedsTint
      ? `${getCoverageDirective(input.colorCoverage)} At this low intensity those surfaces carry only pale, desaturated tints of the palette.`
      : getCoverageDirective(input.colorCoverage);
  const architecturalSurfaceDirective = getArchitecturalSurfaceDirective(
    input.colorStrategy,
    input.colorCoverage,
    input.colorIntensity,
    palette
  );
  const paletteEvolutionDirective = getPaletteCohesionDirective(
    input.autoPaletteVariation,
    input.imageIndex,
    input.maxImages
  );
  const variationDirective = generatePaletteVariation(palette, {
    colorStrategy: input.colorStrategy,
    autoPaletteVariation: input.autoPaletteVariation,
    imageIndex: input.imageIndex,
    maxImages: input.maxImages,
  });

  return `Color system: mood ${input.colorMood}; strategy ${input.colorStrategy}; coverage ${input.colorCoverage}; style ${input.style}. Selected palette family ${palette.family}. Selected palette ${palette.name}. Palette source: ${palette.source}. Required layered palette roles for this image: Primary ${paletteStory.primary}; Secondary ${paletteStory.secondary}; Complementary Accent ${paletteStory.complementaryAccent}; Neutral Grounding ${paletteStory.neutralGrounding}; Wood Tone ${paletteStory.woodTone}; Metal Finish ${paletteStory.metalFinish}; Contrast Tone ${paletteStory.contrastTone}. ${strategyDirective} ${coverageDirective} ${architecturalSurfaceDirective} ${heroDirective} ${intensityDirective} ${variationDirective} ${paletteEvolutionDirective} Keep output realistic, upscale, and materially coherent. Intensity controls amount of color application, not the number of palette roles. Never collapse to two-color schemes like green + beige, blue + gray, red + cream, sage + oak, or terracotta + cream.`;
}
