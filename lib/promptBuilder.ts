export function buildPrompt(
  room: string,
  roomSize: string,
  style: string,
  backyard: string,
  wallTypes: string[],
  accentWallTypes: string[],
  doorwayTypes: string[],
  stairwayTypes: string[],
  accessoryTypes: string[],
  roomDividerTypes: string[],
  fireplaceTypes: string[],
  ceilingTypes: string[],
  ceilingLightTypes: string[]
) {
  const wallDirection =
    wallTypes.length > 0
      ? wallTypes.join(", ")
      : "white walls";

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

  const stairwayDirection =
    stairwayTypes.length > 0
      ? stairwayTypes.join(", ")
      : "clean modern staircase with simple railing";

  const accessoryDirection =
    accessoryTypes.length > 0
      ? accessoryTypes.join(", ")
      : "minimal curated accessories with one statement plant";

  const roomDividerDirection =
    roomDividerTypes.length > 0
      ? roomDividerTypes.join(", ")
      : "minimal architectural room divider";

  const fireplaceDirection =
    fireplaceTypes.length > 0
      ? fireplaceTypes.join(", ")
      : "refined built-in fireplace feature";

  const ceilingLightingDirection =
    ceilingLightTypes.length > 0
      ? ceilingLightTypes.join(", ")
      : "concealed cove lighting";

  return `
Ultra realistic high-end luxury ${style} ${room} with bespoke architecture and curated interior styling.

Design Direction:
- International luxury residential design, editorial quality
- Calm, refined, wealthy atmosphere with timeless proportions
- Bespoke millwork, and seamless built-ins
- Premium materials: marble, stone, wood, metal, glass, and luxurious textiles
- Sculptural designer furniture, collectible decor, layered textures
- Accessory direction: ${accessoryDirection}, arranged with intention and visual balance
- Accessories should feel intentional and minimal, adding character without visual clutter
- Room size direction: ${roomSize}; architecture, furniture scale, circulation space, and camera composition should match this size faithfully
- Wall treatment direction: ${wallDirection}, applied tastefully and cohesively with the architecture
- Accent wall direction: ${accentWallDirection}, with color and pattern integrated as a focused design statement
- Doorway direction: ${doorwayDirection}, architecturally integrated with the room style and premium materiality
- Stairway direction: ${stairwayDirection}, with proportion, railing details, and materials that match the interior style
- Room divider direction: ${roomDividerDirection}, with refined finishes and elegant integration into the floor plan
- Fireplace direction: ${fireplaceDirection}, thoughtfully scaled as a premium focal point with realistic material detail
- Ceiling treatment direction: ${ceilingDirection}, elegant and integrated with the lighting design
- Ceiling lighting direction: ${ceilingLightingDirection}, refined and appropriate for luxury residential interiors
- Floor-to-ceiling glazing and strong indoor-outdoor relationship
- Perfect spatial balance, clean lines, no clutter

Lighting:
- Soft natural daylight, cinematic diffusion, gentle shadows
- Warm indirect cove lighting, premium lamp glow, realistic exposure
- HDR photoreal rendering, physically accurate materials

Camera:
- Wide interior composition, straight verticals, professional framing
- Architectural Digest / high-end design magazine look
- 8k detail, tack-sharp focus, premium real-estate editorial photography

Backyard view:
- ${backyard}, beautifully framed through large windows or sliding glass walls with realistic landscaping depth

Negative cues:
- No cartoon look, no CGI plastic surfaces, no over-saturation, no distortion, no clutter
`;
}
