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

export function buildExteriorSafetyFallbackPrompt(
  scenario: ExteriorScenario,
  index: number,
  maxImages: number
): string {
  return `Photorealistic ${scenario.homeStyle} home exterior photograph.
${scenario.facadeMaterial}; ${scenario.roofStyle}; ${scenario.frontDoor}.
${scenario.landscaping}; ${scenario.drivewayWalkway}; ${scenario.garage}.
${scenario.timeOfDay}; ${scenario.cameraView}.
Architecture and landscaping only; no people.

Variation ${index + 1} of ${maxImages}.`;
}
