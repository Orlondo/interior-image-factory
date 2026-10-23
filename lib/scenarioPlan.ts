import type { RoomType } from "./combinations";
import {
  FULL_ENUMERATION_LIMIT,
  decodeIndex,
  sampleDistinctIndices,
  totalCombinations,
} from "./scenarioSampling";

export type PromptScenario = {
  room: RoomType;
  view: string;
  colorProfile: string;
  focalPoints: string[];
  windowStyle: string;
  wall: string;
  ceiling: string;
  ceilingLight: string;
  wallColorPalette: string;
};

export type ScenarioPlanInput = {
  rooms: RoomType[];
  /** Images wanted for each room, in the same order as `rooms`. */
  counts: number[];
  views: string[];
  colorProfiles: string[];
  focalPoints: string[];
  windowStyles: string[];
  walls: string[];
  ceilings: string[];
  ceilingLights: string[];
  random: () => number;
  /** Called once per chosen scenario to pick its wall color palette. */
  pickWallColorPalette: () => string;
};

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const held = copy[index] as T;
    copy[index] = copy[swapIndex] as T;
    copy[swapIndex] = held;
  }

  return copy;
}

/**
 * Chooses exactly `counts[i]` scenarios for each room, then mixes the rooms together.
 * Small selections list every combination for a room and take them in shuffled order,
 * cycling if more images are wanted than combinations. Very large selections sample
 * directly so memory stays small.
 */
export function buildScenarioPlan(input: ScenarioPlanInput): PromptScenario[] {
  const sizes = [
    input.views.length,
    input.colorProfiles.length,
    input.focalPoints.length,
    input.windowStyles.length,
    input.walls.length,
    input.ceilings.length,
    input.ceilingLights.length,
  ];
  const poolSize = totalCombinations(sizes);

  const scenarioAt = (room: RoomType, combinationIndex: number): PromptScenario => {
    const [view, colorProfile, focalPoint, windowStyle, wall, ceiling, ceilingLight] =
      decodeIndex(combinationIndex, sizes);

    return {
      room,
      view: input.views[view ?? 0] as string,
      colorProfile: input.colorProfiles[colorProfile ?? 0] as string,
      focalPoints:
        input.focalPoints.length > 0 ? [input.focalPoints[focalPoint ?? 0] as string] : [],
      windowStyle: input.windowStyles[windowStyle ?? 0] as string,
      wall: input.walls[wall ?? 0] as string,
      ceiling: input.ceilings[ceiling ?? 0] as string,
      ceilingLight: input.ceilingLights[ceilingLight ?? 0] as string,
      wallColorPalette: input.pickWallColorPalette(),
    };
  };

  const planned: PromptScenario[] = [];

  input.rooms.forEach((room, roomIndex) => {
    const wanted = input.counts[roomIndex] ?? 0;

    if (wanted <= 0) {
      return;
    }

    if (poolSize <= FULL_ENUMERATION_LIMIT) {
      const order = shuffle(
        Array.from({ length: poolSize }, (_, index) => index),
        input.random
      );

      for (let pick = 0; pick < wanted; pick += 1) {
        planned.push(scenarioAt(room, order[pick % poolSize] as number));
      }
      return;
    }

    sampleDistinctIndices(poolSize, wanted, input.random).forEach((combinationIndex) => {
      planned.push(scenarioAt(room, combinationIndex));
    });
  });

  return shuffle(planned, input.random);
}
