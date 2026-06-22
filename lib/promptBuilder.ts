export function buildPrompt(
  room: string,
  roomSize: string,
  style: string,
  backyard: string,
  customRequest: string,
  wallTypes: string[],
  accentWallTypes: string[],
  doorwayTypes: string[],
  stairwayTypes: string[],
  accessoryTypes: string[],
  basementFeatureTypes: string[],
  homeTheaterFeatureTypes: string[],
  homeBarFeatureTypes: string[],
  homeGymFeatureTypes: string[],
  pantryFeatureTypes: string[],
  homeOfficeFeatureTypes: string[],
  laundryRoomFeatureTypes: string[],
  mudRoomFeatureTypes: string[],
  walkInClosetFeatureTypes: string[],
  roomDividerTypes: string[],
  fireplaceTypes: string[],
  ceilingTypes: string[],
  ceilingLightTypes: string[],
  wallPaintColors: string[],
  cabinetStyle: string,
  cabinetColor: string,
  cabinetFinish: string,
  houseLevel: string,
  characterIntensity: "subtle" | "balanced" | "bold"
) {
  const styleLower = (style || "").toLowerCase();

  const styleCharacterDirection = (() => {
    if (styleLower.includes("mid-century")) {
      return "Mix warm wood tones, vintage silhouettes, and one collectible statement piece for character";
    }
    if (styleLower.includes("art-deco") || styleLower.includes("glam")) {
      return "Use bold geometry, layered metallic accents, and rich contrast with a memorable focal moment";
    }
    if (
      styleLower.includes("eclectic") ||
      styleLower.includes("bohemian") ||
      styleLower.includes("global")
    ) {
      return "Blend collected pieces across eras, artisanal textures, and pattern-on-pattern moments with restraint";
    }
    if (styleLower.includes("industrial")) {
      return "Balance raw materials with warm textiles, sculptural lighting, and curated patina";
    }
    if (
      styleLower.includes("farmhouse") ||
      styleLower.includes("traditional") ||
      styleLower.includes("transitional")
    ) {
      return "Layer heritage details, mixed finishes, and subtle old-meets-new contrast for depth";
    }
    if (styleLower.includes("coastal")) {
      return "Use sun-faded tones, tactile natural fibers, and a relaxed collected feel rather than theme styling";
    }
    if (
      styleLower.includes("minimal") ||
      styleLower.includes("japandi") ||
      styleLower.includes("scandinavian")
    ) {
      return "Keep the palette restrained but introduce tactile contrast, sculptural forms, and a strong hero vignette";
    }

    return "Create visual character through layered textures, tonal contrast, and at least one memorable design focal point";
  })();

  const characterIntensityDirection =
    characterIntensity === "subtle"
      ? "Subtle character: keep restraint, with one quiet focal detail and minimal pattern mixing"
      : characterIntensity === "bold"
      ? "Bold character: use stronger contrast, expressive layering, and two coordinated focal moments"
      : "Balanced character: combine restraint with distinct personality through layered textures and one strong focal point";

  const paintDescription = wallPaintColors.length > 0 ? wallPaintColors.join(", ") : "";

  const wallDirection = (() => {
    const selectedWalls = wallTypes.length > 0 ? [...wallTypes] : [];

    if (selectedWalls.length > 0) {
      const normalizedWalls = selectedWalls
        .map((wallType) => (wallType === "white walls" ? "" : wallType))
        .filter(Boolean);

      if (paintDescription) {
        normalizedWalls.push(paintDescription);
      }

      return normalizedWalls.length > 0
        ? normalizedWalls.join(", ")
        : paintDescription || "soft dove gray paint";
    }

    return paintDescription || "soft dove gray paint";
  })();

  const hasConcreteWalls = wallTypes.some(
    (wallType) => wallType.toLowerCase() === "concrete walls"
  );

  const concreteWallDetailDirection = hasConcreteWalls
    ? "- Concrete detailing: realistic cast or board-formed concrete texture, subtle pores and form-tie marks, matte sealed finish, no glossy CGI look"
    : "";

  const isBasementRoom = room.toLowerCase() === "basement";

  const basementFeatureDirection =
    isBasementRoom && basementFeatureTypes.length > 0
      ? basementFeatureTypes.join(", ")
      : isBasementRoom
      ? "finished basement lounge with rich textures"
      : "not a basement room; keep above-grade residential architecture";

  const nonBasementConstraint = isBasementRoom
    ? ""
    : "- Basement constraint: no exposed foundation walls, no small hopper windows, no below-grade bunker feeling";

  const isHomeTheaterRoom = room.toLowerCase() === "in-home theater";

  const homeTheaterFeatureDirection =
    isHomeTheaterRoom && homeTheaterFeatureTypes.length > 0
      ? homeTheaterFeatureTypes.join(", ")
      : isHomeTheaterRoom
      ? "large projection screen with surround sound"
      : "not a theater room; keep media scale residential and integrated";

  const nonTheaterMediaConstraint = isHomeTheaterRoom
    ? ""
    : "- Media constraint: no oversized TV walls, no projection screen, no dedicated cinema seating";

  const homeBarFeatureDirection =
    homeBarFeatureTypes.length > 0
      ? homeBarFeatureTypes.join(", ")
      : "no dedicated home bar feature";

  const noHomeBarConstraint = homeBarFeatureTypes.length > 0
    ? ""
    : "- Home bar constraint: no wet bar counter, no bar stools lineup, no wine wall display";

  const homeGymFeatureDirection =
    homeGymFeatureTypes.length > 0
      ? homeGymFeatureTypes.join(", ")
      : "mirrored wall with rubber flooring and free weights";

  const pantryFeatureDirection =
    pantryFeatureTypes.length > 0
      ? pantryFeatureTypes.join(", ")
      : "walk-in pantry with open shelving and labeled containers";

  const homeOfficeFeatureDirection =
    homeOfficeFeatureTypes.length > 0
      ? homeOfficeFeatureTypes.join(", ")
      : "built-in desk with floating shelving and integrated task lighting";

  const laundryRoomFeatureDirection =
    laundryRoomFeatureTypes.length > 0
      ? laundryRoomFeatureTypes.join(", ")
      : "stacked washer-dryer with folding counter and hanging rod";

  const mudRoomFeatureDirection =
    mudRoomFeatureTypes.length > 0
      ? mudRoomFeatureTypes.join(", ")
      : "built-in bench with cubbies and durable tile flooring";

  const walkInClosetFeatureDirection =
    walkInClosetFeatureTypes.length > 0
      ? walkInClosetFeatureTypes.join(", ")
      : "custom walk-in closet with island and soft-close drawers";

  const level = (houseLevel || "").toLowerCase();

  const cabinetDirection = cabinetStyle
    ? `${cabinetStyle} in ${cabinetColor} with ${cabinetFinish}`
    : level === "luxury"
    ? `luxury custom cabinetry in ${cabinetColor} with ${cabinetFinish}`
    : level === "mid-level"
    ? `refined cabinetry in ${cabinetColor} with ${cabinetFinish}`
    : `standard builder-grade cabinetry in ${cabinetColor} with ${cabinetFinish}`;

  const ceilingDirection =
    ceilingTypes.length > 0
      ? ceilingTypes.join(", ")
      : "smooth white ceiling";

  const accentWallDirection =
    accentWallTypes.length > 0
      ? accentWallTypes.join(", ")
      : "subtle tonal accent wall";

  const doorwayDirection =
    doorwayTypes.length > 0
      ? doorwayTypes.join(", ")
      : "minimal painted doorway";

  const hasWalnutDoorwaySelected = doorwayTypes.some((doorwayType) =>
    doorwayType.toLowerCase().includes("walnut")
  );

  const nonWalnutDoorwayConstraint = hasWalnutDoorwaySelected
    ? ""
    : "- Doorway constraint: avoid walnut doorway surrounds; follow selected doorway material and profile";

  const stairwayDirection =
    stairwayTypes.length > 0
      ? stairwayTypes.join(", ")
      : "clean modern staircase with simple railing";

  const accessoryDirection =
    accessoryTypes.length > 0
      ? accessoryTypes
          .map((accessory) =>
            /hard\s*cover|book/i.test(accessory) ? "SETRY HOMES" : accessory
          )
          .join(", ")
      : "minimal curated accessories with one statement plant";

  const customRequestDirection = customRequest
    ? `- Specific request: ${customRequest}`
    : "";

  const roomDividerDirection =
    roomDividerTypes.length > 0
      ? roomDividerTypes.join(", ")
      : "minimal architectural room divider";

  const fireplaceDirection =
    fireplaceTypes.length > 0
      ? fireplaceTypes.join(", ")
      : "no dedicated fireplace feature";

  const noStoneFireplaceConstraint = fireplaceTypes.some((fireplaceType) =>
    fireplaceType.toLowerCase().includes("stone")
  )
    ? ""
    : "- Fireplace constraint: avoid stone fireplace surrounds; no full-height stone accent walls";

  const ceilingLightingDirection =
    ceilingLightTypes.length > 0
      ? ceilingLightTypes.join(", ")
      : "concealed cove lighting";

  const headline =
    level === "luxury"
      ? `Ultra realistic high-end luxury ${style} ${room} with bespoke architecture and curated interior styling.`
      : level === "mid-level"
      ? `Photoreal ${style} ${room} with refined, quality-focused residential styling.`
      : `Functional ${style} ${room} with practical builder-grade residential styling and accessible finishes.`;

  const materials =
    level === "luxury"
      ? "Premium materials: marble, stone, wood, metal, glass, and luxurious textiles"
      : level === "mid-level"
      ? "Quality materials: wood, stone, engineered surfaces, and tasteful upholstery"
      : "Practical materials: affordable wood veneers, laminate, painted MDF, and standard fixtures";

  const lightingTone =
    level === "luxury"
      ? "Warm indirect cove lighting, premium lamp glow, realistic exposure"
      : level === "mid-level"
      ? "Soft natural daylight with practical, well-designed ambient lighting"
      : "Bright, even daylight with straightforward recessed or pendant fixtures";

  return `
${headline}

Design Direction:
- ${level === "luxury" ? "International luxury residential design, editorial quality" : level === "mid-level" ? "Refined mid-level residential design, balanced and tasteful" : "Builder-grade residential design, practical, compact, and cost-conscious"}
- Calm, composed atmosphere with appropriate proportions
- Bespoke millwork and seamless built-ins when appropriate
- ${materials}
- Character direction: ${styleCharacterDirection}
- Character intensity: ${characterIntensityDirection}
- ${characterIntensity === "bold" ? "Include two intentional focal points that work together (hero furniture, art wall, sculptural light, or striking material contrast)" : "Include one intentional focal point (hero furniture piece, art wall, sculptural light, or striking material contrast)"}
- Layer old and new elements for personality; avoid a showroom-perfect look
- ${characterIntensity === "subtle" ? "Add very light lived-in storytelling cues (curated books, textiles, personal objects) while staying calm and edited" : characterIntensity === "bold" ? "Add clear lived-in storytelling cues (curated books, textiles, personal objects) with richer layering, while avoiding mess" : "Add subtle lived-in storytelling cues (curated books, textiles, personal objects), but keep visual control"}
- Compact, functional floor plans with smaller separate rooms rather than a grand open plan
- Simple suburban or inner-city home layout under 1,500 square feet when builder-grade is selected
- Room sizes should feel cozy: 150-300 square foot spaces for builder-grade rooms
- Accessory direction: ${accessoryDirection}, arranged with intention and visual balance
- Accessories should feel intentional, collected over time, and edited for balance
${customRequestDirection ? `${customRequestDirection}
` : ""}- Room size direction: ${roomSize}; architecture, furniture scale, circulation space, and camera composition should match this size faithfully
- Wall treatment direction: ${wallDirection}, applied tastefully and cohesively with the architecture
${concreteWallDetailDirection ? `${concreteWallDetailDirection}
` : ""}- Basement feature direction: ${basementFeatureDirection}
${nonBasementConstraint ? `${nonBasementConstraint}
` : ""}- Home theater direction: ${homeTheaterFeatureDirection}
${nonTheaterMediaConstraint ? `${nonTheaterMediaConstraint}
` : ""} - Home bar direction: ${homeBarFeatureDirection}
${noHomeBarConstraint ? `${noHomeBarConstraint}
` : ""} - Home gym direction: ${homeGymFeatureDirection}
 - Pantry direction: ${pantryFeatureDirection}
 - Home office direction: ${homeOfficeFeatureDirection}
 - Laundry room direction: ${laundryRoomFeatureDirection}
 - Mud room direction: ${mudRoomFeatureDirection}
 - Walk-in closet direction: ${walkInClosetFeatureDirection}
- Accent wall direction: ${accentWallDirection}, with color and pattern integrated as a focused design statement
- Doorway direction: ${doorwayDirection}
${nonWalnutDoorwayConstraint ? `${nonWalnutDoorwayConstraint}
` : ""}- Stairway direction: ${stairwayDirection}
- Cabinetry direction: ${cabinetDirection}, seamlessly integrated into the overall design
- Room divider direction: ${roomDividerDirection}
- Fireplace direction: ${fireplaceDirection}
${noStoneFireplaceConstraint ? `${noStoneFireplaceConstraint}
` : ""}- Ceiling treatment direction: ${ceilingDirection}
- Ceiling lighting direction: ${ceilingLightingDirection}, ${level === "luxury" ? "refined and appropriate for luxury residential interiors" : level === "mid-level" ? "balanced and practical" : "straightforward and functional"}
- Avoid grand open-plan layouts and floor-to-ceiling glazing when builder-grade is selected
 - Avoid grand open-plan layouts; use appropriately scaled, regular-sized windows when builder-grade is selected
- Clean composition with restrained complexity and curated depth

Lighting:
- Soft natural daylight, cinematic diffusion as appropriate
- ${lightingTone}
- HDR photoreal rendering, physically accurate materials

Camera:
- Wide interior composition, straight verticals, professional framing
- Editorial photography look appropriate to the house level
- High detail, tack-sharp focus, realistic photographic qualities

Backyard view:
- ${backyard}, framed through windows or sliding doors with realistic depth

Negative cues:
- No cartoon look, no CGI plastic surfaces, no over-saturation, no distortion, no messy clutter
`;
}
