"use client";

import {
  colorCoverages,
  colorMoods,
  colorProfiles,
  colorStrategies,
  heroColors,
  singleHeroColors,
  type ColorCoverage,
  type ColorMood,
  type ColorStrategy,
  type HeroColor,
} from "@/lib/combinations";
import type { Setup } from "@/lib/setup";
import { CheckboxField, SelectField } from "./fields";
import { IntensitySteps } from "./IntensitySteps";
import { OptionGroup } from "./OptionGroup";

const MIXED_HERO_COLORS = heroColors.filter(
  (color) => !(singleHeroColors as readonly string[]).includes(color)
);

type CustomizeColorsProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

export function CustomizeColors({ setup, update }: CustomizeColorsProps) {
  const neutralGuardrailsOn =
    setup.colorStrategy === "Neutral Base" || setup.colorCoverage === "Decor Only";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Color mood"
          value={setup.colorMood}
          onChange={(value) => update({ colorMood: value as ColorMood })}
        >
          {colorMoods.map((mood) => (
            <option key={mood} value={mood}>
              {mood}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Color strategy"
          value={setup.colorStrategy}
          onChange={(value) => update({ colorStrategy: value as ColorStrategy })}
        >
          {colorStrategies.map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Palette family"
          value={setup.heroColor}
          onChange={(value) => update({ heroColor: value as HeroColor })}
        >
          <optgroup label="Mixed families">
            {MIXED_HERO_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </optgroup>
          <optgroup label="Single color">
            {singleHeroColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </optgroup>
        </SelectField>

        <SelectField
          label="Color coverage"
          value={setup.colorCoverage}
          onChange={(value) => update({ colorCoverage: value as ColorCoverage })}
        >
          {colorCoverages.map((coverage) => (
            <option key={coverage} value={coverage}>
              {coverage}
            </option>
          ))}
        </SelectField>
      </div>

      {neutralGuardrailsOn ? (
        <p className="text-xs text-[#98A2B3]">
          Neutral Base strategy and Decor Only coverage keep walls and large furniture neutral,
          so the palette shows up in decor and textiles.
        </p>
      ) : null}

      <IntensitySteps
        intensity={setup.colorIntensity}
        onChange={(colorIntensity) => update({ colorIntensity })}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CheckboxField
          label="Auto palette variation"
          checked={setup.autoPaletteVariation}
          onChange={(autoPaletteVariation) => update({ autoPaletteVariation })}
        />
        <CheckboxField
          label="Randomize wall color"
          checked={setup.randomizeWallColor}
          onChange={(randomizeWallColor) => update({ randomizeWallColor })}
        />
      </div>

      <OptionGroup
        bare
        legend="Color profile"
        allLabel="All color profiles"
        options={colorProfiles}
        selected={setup.colorProfiles}
        onChange={(next) => update({ colorProfiles: next })}
      />
    </div>
  );
}
