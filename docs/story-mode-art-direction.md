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
- Body, face, and accessory layers use native 32×64 frames with 2×2 pixel
  clusters throughout. Hands and feet also use 2×2 blocks for their outlines
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
  Preserve each expression’s distinct eyes and mouth in the clustered 32×64 frame;
  never replace them with a generic smile. Hide faces for
  rear views.
- NPCs use a planted stance: no independent fractional bobbing of their body,
  face, hands or sword. Snap character compositor translations to display pixels.
- Player body texture scale and orientation stay fixed during animations. Turn
  using the face, gear and limbs; do not continuously squeeze or mirror the baked body.
- The hub gatehouse sits at the northern approach defined in TOWN.gatehouse;
  use that same source for rendering, arrival and interaction. Keep its roof
  separate from the tea-room and preserve the northward camera/terrain bounds.
