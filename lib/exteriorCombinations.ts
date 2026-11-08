export const photoTypes = ["interior", "exterior", "accessory"] as const;
export type PhotoType = (typeof photoTypes)[number];

export const exteriorHomeStyles = [
  "modern",
  "modern farmhouse",
  "craftsman",
  "traditional colonial",
  "mid-century modern",
  "Mediterranean",
  "Spanish revival",
  "Tudor",
  "contemporary minimalist",
  "coastal cottage",
  "ranch",
  "Scandinavian",
  "Japandi",
];

export const exteriorFacadeMaterials = [
  "smooth white stucco",
  "warm red brick",
  "natural stone veneer",
  "board-and-batten siding",
  "horizontal lap siding",
  "cedar wood cladding",
  "dark charcoal metal panels",
  "mixed stone and wood facade",
  "painted brick",
  "shingle siding",
];

export const exteriorRoofStyles = [
  "gabled asphalt shingle roof",
  "standing seam metal roof",
  "clay barrel tile roof",
  "flat modern roof with clean parapet",
  "hipped roof",
  "cedar shake roof",
  "slate roof",
  "multi-gabled roofline with dormers",
];

export const exteriorFrontDoors = [
  "bold colored front door with simple trim",
  "natural wood front door with sidelights",
  "oversized pivot front door",
  "black glass-paneled front door",
  "double front doors with a transom window",
  "arched wood front door with iron hardware",
  "covered porch entry with a classic paneled door",
];

export const exteriorLandscaping = [
  "manicured lawn with clean hedges",
  "drought-tolerant garden with succulents and gravel",
  "lush layered flower beds",
  "mature trees with natural woodland planting",
  "minimalist landscaping with ornamental grasses",
  "tropical plantings with palms",
  "formal symmetrical garden with boxwoods",
  "stone-edged garden beds with seasonal color",
];

export const exteriorDrivewayWalkways = [
  "concrete driveway with a straight paver walkway",
  "gravel driveway with stepping-stone path",
  "brick paver driveway with a curved walkway",
  "black asphalt driveway with a clean concrete path",
  "stamped concrete driveway and entry path",
  "circular driveway with a stone entry walk",
];

export const exteriorTimesOfDay = [
  "bright midday sun with blue sky",
  "golden hour with warm low sunlight",
  "twilight with warm glowing windows and landscape lighting",
  "overcast soft daylight",
  "light rain with wet surfaces and soft reflections",
  "snowy winter day with a light snow dusting",
  "misty early morning",
];

export const exteriorCameraViews = [
  "straight-on front elevation",
  "front corner angle showing two sides of the home",
  "elevated aerial view of the home and property",
  "street-level view from across the road",
  "low angle view emphasizing the entry",
  "backyard view with patio",
];

export const exteriorGarages = [
  "no garage visible",
  "attached two-car garage with modern panel doors",
  "attached garage with carriage-style wood doors",
  "detached garage with matching facade",
  "three-car garage with side-load orientation",
  "carport with simple modern columns",
];

export type ExteriorOptions = {
  homeStyles: string[];
  facadeMaterials: string[];
  roofStyles: string[];
  frontDoors: string[];
  landscaping: string[];
  drivewayWalkways: string[];
  timesOfDay: string[];
  cameraViews: string[];
  garages: string[];
};

export const exteriorOptionGroups: Array<{
  key: keyof ExteriorOptions;
  legend: string;
  allLabel: string;
  options: string[];
}> = [
  { key: "homeStyles", legend: "Home style", allLabel: "All home styles", options: exteriorHomeStyles },
  { key: "facadeMaterials", legend: "Facade material", allLabel: "All facade materials", options: exteriorFacadeMaterials },
  { key: "roofStyles", legend: "Roof style", allLabel: "All roof styles", options: exteriorRoofStyles },
  { key: "frontDoors", legend: "Front door", allLabel: "All front doors", options: exteriorFrontDoors },
  { key: "landscaping", legend: "Landscaping", allLabel: "All landscaping", options: exteriorLandscaping },
  { key: "drivewayWalkways", legend: "Driveway / walkway", allLabel: "All driveways / walkways", options: exteriorDrivewayWalkways },
  { key: "timesOfDay", legend: "Time of day / weather", allLabel: "All times of day / weather", options: exteriorTimesOfDay },
  { key: "cameraViews", legend: "Camera view", allLabel: "All camera views", options: exteriorCameraViews },
  { key: "garages", legend: "Garage", allLabel: "All garage options", options: exteriorGarages },
];

export function createEmptyExteriorOptions(): ExteriorOptions {
  return {
    homeStyles: [],
    facadeMaterials: [],
    roofStyles: [],
    frontDoors: [],
    landscaping: [],
    drivewayWalkways: [],
    timesOfDay: [],
    cameraViews: [],
    garages: [],
  };
}
