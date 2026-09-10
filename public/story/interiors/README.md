# Inkwell interior tiles

Every PNG is exactly 32x32 pixels, without antialiasing, from original integer-pixel
artwork. One tile per file. Beds assemble separate head and foot tiles.

Regenerate: `node scripts/generate-interior-assets.mjs`.

The generator contains source artwork and four fabric ramps (teal, rust, moss,
plum). Change a ramp to recolor fabric without changing the wood or shadows.
Placement and collision are defined in `src/game/story/interiorPlans.ts`.
Floors, architecture, rugs and furniture are independently layered.

Keep new assets medieval, with cool outlines, upper-left light and shaded undersides.
Run `npm test` for asset dimensions and layout reachability.
