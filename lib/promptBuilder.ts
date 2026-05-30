export function buildPrompt(
  room: string,
  roomSize: string,
  style: string,
  view: string,
  wallTypes: string[],
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

  const ceilingLightingDirection =
    ceilingLightTypes.length > 0
      ? ceilingLightTypes.join(", ")
      : "concealed cove lighting";

  return `
Ultra realistic high-end luxury ${style} ${room} with bespoke architecture and curated interior styling.

Design Direction:
- International luxury residential design, editorial quality
- Calm, refined, wealthy atmosphere with timeless proportions
- Bespoke millwork, fluted paneling, and seamless built-ins
- Premium materials: vein-cut travertine, Calacatta marble, white oak, brushed brass, boucle, linen, smoked glass
- Sculptural designer furniture, collectible decor, layered textures
- Subtle styling accessories: one or two framed paintings, curated art pieces, a refined sculpture, handmade pottery, and a few well-placed design books
- Accessories should feel intentional and minimal, adding character without visual clutter
- Room size direction: ${roomSize}; architecture, furniture scale, circulation space, and camera composition should match this size faithfully
- Wall treatment direction: ${wallDirection}, applied tastefully and cohesively with the architecture
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

View:
- ${view}, beautifully framed through large windows or sliding glass walls

Negative cues:
- No cartoon look, no CGI plastic surfaces, no over-saturation, no distortion, no clutter
`;
}
