import { exteriorOptionGroups, type ExteriorOptions } from "./exteriorCombinations";

export type ExteriorScenario = {
  homeStyle: string;
  facadeMaterial: string;
  roofStyle: string;
  frontDoor: string;
  landscaping: string;
  drivewayWalkway: string;
  timeOfDay: string;
  cameraView: string;
  garage: string;
};

export function buildExteriorPrompt(
  scenario: ExteriorScenario,
  homeQuality: string,
  index: number,
  maxImages: number
): string {
  const isBuilderGrade = homeQuality === "builder's grade layout";
  const qualityDirection = isBuilderGrade
    ? "Modest entry-level tract home with simple finishes and a small footprint, with the selected exterior upgrades clearly visible."
    : `Home quality: ${homeQuality}, with finishes and craftsmanship that match.`;

  return `Photorealistic professional real-estate exterior photograph of a single-family home.
${qualityDirection}

Exterior direction:
- Architectural style: ${scenario.homeStyle}
- Facade material: ${scenario.facadeMaterial}
- Roof: ${scenario.roofStyle}
- Front door: ${scenario.frontDoor}
- Landscaping: ${scenario.landscaping}
- Driveway and walkway: ${scenario.drivewayWalkway}
- Garage: ${scenario.garage}
- Lighting and weather: ${scenario.timeOfDay}
- Camera view: ${scenario.cameraView}

Rules:
- Show the home exterior, or the specific outdoor space named in the camera view, in a realistic residential setting with believable proportions, structural logic, and consistent materials.
- Keep the architecture, materials, and landscaping cohesive with the selected style.
- No people, vehicles are optional and must be unobtrusive, no text or watermarks, no surreal elements.

Variation ${index + 1} of ${maxImages}.`;
}

const SCENARIO_KEYS: Array<[keyof ExteriorScenario, keyof ExteriorOptions]> = [
  ["homeStyle", "homeStyles"],
  ["facadeMaterial", "facadeMaterials"],
  ["roofStyle", "roofStyles"],
  ["frontDoor", "frontDoors"],
  ["landscaping", "landscaping"],
  ["drivewayWalkway", "drivewayWalkways"],
  ["timeOfDay", "timesOfDay"],
  ["cameraView", "cameraViews"],
  ["garage", "garages"],
];

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }

  return copy;
}

/**
 * Chooses `count` exterior scenarios. Each option group is shuffled and cycled on its own, so a group
 * with several options shows all of them before any repeats, and the groups vary independently.
 */
export function buildExteriorScenarios(
  count: number,
  options: ExteriorOptions,
  random: () => number
): ExteriorScenario[] {
  const orders = Object.fromEntries(
    exteriorOptionGroups.map(({ key }) => [key, shuffled(options[key], random)])
  ) as Record<keyof ExteriorOptions, string[]>;

  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const scenario = {} as ExteriorScenario;

    for (const [field, group] of SCENARIO_KEYS) {
      const order = orders[group];
      scenario[field] = order[index % order.length] as string;
    }

    return scenario;
  });
}
