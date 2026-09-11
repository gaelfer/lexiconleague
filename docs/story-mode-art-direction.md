# Story-mode art direction

Approved direction: painterly pixel-art storybook world, with readable adventure-game
silhouettes and Lexicon League's ink, paper, and living-language identity.

- Use a consistent 16px native-art construction grid (32 map units at 2× output) and restrained pixel-scale texture details.
- Rounded teardrops have tiny circular hands and feet, matching ink colors, subtle
  shading, and crisp outlines. Preserve avatar cosmetics and sword-hand alignment.
- Light comes from the upper left. Cast shadows extend down and right. Use cool
  colored shadows, warm cream window light, and strong glow only for magical objects.
- Village palette: moss green, muted teal, warm cream, reddish timber. Corruption:
  deep blue ink and subdued violet. Avoid saturated unrelated accent colors.
- Materials must read as timber, mossy stone, parchment, or ink. Detail should describe
  construction and wear, not be arbitrary decorative shapes or noisy checkerboards.
- Buildings share the same architectural family. The Archive is older and grander,
  but belongs to the village. No floating building labels or doorway icons.
  Small timber plaques are mounted directly on building walls. Walking up against
  a plaque reveals its name without E or a dialogue lock; moving away hides it.
  Keep the reading tile off the doorway column and add no ground signpost collision. The
  Wayfarer uses directional boards and a separate, responsive instruction panel;
  labels must not cover the player or exits. All gatehouse triggers use the actual
  threshold tile, not the arrival tile one step south of it.
- Interiors have furnished edges, open walking space, one memorable centerpiece,
  and signs of ordinary life. Optional buildings must support exploration and lore.
- Establish and visually inspect a polished reference exterior and interior with the
  player visible before calling a wider visual redesign finished.
- Story bodies and accessories are converted from profile SVG layers into hard-alpha pixel
  textures in Boot. Bodies bake the selected ink color into a five-shade ramp;
  never apply setTintFill to a converted body, which would erase its shading.
  Preserve separate eyes/accessories, facing, and weapon grip alignment. Hands
  and feet use matching stepped pixel silhouettes and the same ink palette.
- Before completing a visual change, capture and inspect in-browser screenshots
  of the affected scenes with the player visible. Inspect entrances and a central
  composition, not only the spawn. Correct visible regressions before handoff;
  report unreviewed scenes explicitly. Compilation is not a visual quality gate.
- Terrain construction uses 16 native pixels per tile, represented by 32 legacy map units. The complete Inkling rig
  uses a shared small scale; scale physics and interactions with room migrations.
- Compactness applies to interiors, not shrinking outdoor scenery. Interiors use
  native 16px tiles at 2× display scale with no fractional room scaling. The native
  town camera, routes and interiors use 0.75 map-unit zoom.
  The canvas scales exactly 2×; resizing
  changes viewport dimensions rather than stretching pixels. Dialogue has its own camera.
- House interiors use independent furniture PNGs and stable per-house layouts,
  not a single illustration. See interiorPlans.ts and tileInterior.ts.
- The hub follows docs/inkwell-town-model.md: the user's supplied city layout,
  adapted to original Inkwell buildings with no southern water.
  NPC chatter is brief and personal; major story scenes use lively ensemble banter.
- The hub Archive uses archiveExterior.ts: sandstone reading hall, slate gables,
  recessed oak doors, leaded windows and a carved book crest. Preserve its existing
  south doorstep and tile-aligned collision. Do not substitute an enlarged cottage.
- Movement is now committed 16-native-pixel (32 map-unit) tile-to-tile stepping, with smooth interpolation,
  buffered taps, and no diagonal corner cutting. Do not restore free movement.
- Building and bedroom doors open on northward movement (W / up), with a short
  doorway animation. Center every exterior door on one movement-grid column;
  move the building, path and collision together, never slide the player off-grid.
  Wait for the player to finish stepping onto the exact doorstep; proximity alone
  must not trigger entry or snap an unfinished step. Open the leaf, then visibly
  walk through it before changing scenes. Exits require reaching their actual tile.
  Assign a matching leaf style explicitly: cottage timber, inn oak, bedroom panel,
  Archive arched double doors, or reinforced Wayfarer gate. Static and moving leaves
  share their artwork. Open interior passageways remain open; do not add phantom doors.
  Entrances use a
  hinged-door animation; southern room exits use S / down. Do not show E-to-enter
  labels. E remains for people, objects and stair interactions. NPC foot colliders
  must stay inside their occupied grid tile so the next row remains walkable.
- All nine village interiors share a medieval kit: timber, linen quilts, pottery,
  parchment, stone hearths and leaded windows. No TVs, modern taps or glass tables.
  Every home has a bed; Mira and Luma have separate beds.
- Every new furniture tile MUST be a separate exactly 16x16 PNG in
  public/story/interiors. Assemble larger objects from separate tiles, never stretch.
  Source art and recolorable material ramps: scripts/interior-pixels.mjs; run
  scripts/generate-interior-assets.mjs to regenerate. Do not downsample the old kit.
  Use upper-left highlights, cool dark outlines, undersides, grain and hardware.
  Details must make objects recognizable, not add arbitrary noise.
- Floors, rugs, walls and furniture remain separate layers.
- Outdoor roofs and tree canopies use foreground.ts: a real alpha-silhouette
  overhead layer at depth 30, above actors but below UI. readableText.ts masks
  the full-resolution character pass with the same silhouette; never reduce
  avatar resolution to fix occlusion. Trunks and building footprints stay solid.
- Development screenshot entry: /story/1?interiorReview=home (or another interiorPlans key).
- Chapter 1 is the woodland approach, not a second copy of Inkwell. Only the hub
  contains village homes and the Archive. Use the Wayfarer Gatehouse for travel
  between the approach, village and Wordwood; keep arrivals outside collision.
- Inkwell Road follows roadPlan.ts: river crossing, northern survey-camp bend,
  southern orchard loop, then the travellers' gatehouse clearing. Preserve the
  three saved seal IDs/positions and the opening encounter. Forest pockets frame
  the authored paths; do not turn it back into a single straight road.
- Wordwood’s signs visibly restore landmarks. Its final stones tell the sequence
  seed, sprout, bloom. Preserve both vocabulary and sanctuary progress on travel.
  Field notes are optional hints, not a completion prerequisite. The completed
  verse opens the existing northern gate and directs the player there; it must
  not paint a new path over the terrain.
- Wordwood is a two-part rainy expedition, not a giant-tree dungeon. Optional
  workshop, gallery and storehouse rooms extend the forest. Beyond the gardener's
  gate, the single-floor Sunken Repository contains a hall, sluice room, records,
  seal chamber and Tablet vault. Distinguish flagstone floors from masonry walls;
  show only real exits, keep props layered, and confine indoor rain to roof breaks.
  Tablet pickup preserves character size/cosmetics, raises both hands, plays an
  original short sting, and saves immediately. Bellum learns ink interference only.
- Body, face, and accessory layers use native 32×64 frames. Bodies and accessories
  use 2×2 pixel clusters; faces are a 1px-detail exception so pupils, X-eyes and
  mouths retain their original gaps and expressions. Hands and feet use 2×2 blocks for their outlines
  and shading. All avatar layers share the same 32×64 display footprint, anchored
  over the occupied foot tile. Preserve one-tile movement collision and weapon grips.
  Use the same source crop for faces, bodies, and accessories to preserve alignment.
  The frame is NOT the silhouette: preserve the SVG's aspect ratio and pad the
  frame. Fit all cosmetic layers together, including wide star bodies; never
  stretch teardrops vertically to fill 32 pixels or crop their side points.
- Phaser pixelArt, disabled antialiasing, nearest texture filters, rounded cameras,
  and CSS image-rendering: pixelated are required. Never restore fractional FIT
  canvas scaling or the old 1.2× world zoom.
- Text is a readability exception: readableText.ts composites Phaser text canvases
  at full display resolution. Never downsample glyphs with the world framebuffer.
  Characters use the full-resolution compositor with nearest-neighbor sampling.
  Preserve each expression’s distinct eyes and mouth in the shared 32×64 frame;
  never replace them with a generic smile. Hide faces for
  rear views.
- NPCs use a planted stance: no independent fractional bobbing of their body,
  face, hands or sword. Snap character compositor translations to display pixels.
- Player body texture scale and orientation stay fixed during animations. Turn
  using the face, gear and limbs; do not continuously squeeze or mirror the baked body.
  Death is an exception: the complete avatar collapses into dark ink before the
  respawn fade. Hurt briefly darkens the existing artwork without replacing cosmetics.
- The hub gatehouse sits at the northern approach defined in TOWN.gatehouse;
  use that same source for rendering, arrival and interaction. Keep its roof
  separate from the tea-room and preserve the northward camera/terrain bounds.
- The player's home exists on Inkwell Road only. The southern Lantern Inn serves
  the village: two floors, three furnished rooms per floor, reception downstairs.
  Wren offers 1 to book or 2 to decline. A free booking persists in story progress
  and unlocks upstairs room 202; it stays locked until accepted. Rest there heals.
- Nell lives in the former village player-home plot. The old guest-house building
  is Oren’s private home, with one bed and personal belongings. Keep guest lodging
  in the inn. Wren is the concierge; each inn room has a named conversational NPC.
  Fern is the linen attendant in room 202, which remains the player's booked room.
  Inn bedrooms group beds, storage and rugs into sleeping corners, with separate
  guest-specific work and tea areas. Working guests stand on the tile directly
  beside their furniture, with short activity routes that pause for the player.
  Moss sits with tea; Rue sleeps under her plum quilt. Player sleep uses a closed-eye
  teardrop on the pillow with the actual bed-quilt texture layered over the body.
  Move each guest's collision and interaction target with its rig; never leave a
  static blocker at the original position. Pause activities during dialogue.
  Wren has black ink and a connected oak reception counter extending from the
  west wall with a return around the concierge. Keep the northern guest doors clear.
  Inn corridor doors sit within a continuous, collidable north wall band; the
  first walkable corridor row is y=272. Stairs assemble three 16px sprites into
  a landing, tread section, and foot, with matching three-tile collision.
