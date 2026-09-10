# Inkwell town model

Composition follows the user's supplied town reference, with original buildings
and a dry southern edge. The playable
model lives in `src/game/story/townPlan.ts`; rendering and doors share its data.

       BAKERY  SCRIPTORIUM    │    TEA
       ───── north lane ─────┤            ARCHIVE
              fountain       │              │
       HOME       MIRA       │   GARDENER    │
       ───────── central cross street ──────┘
       GARDEN PAVILION       │   GUARD    GUEST
                             ├───────────────
       ───────── dry southern promenade ─────

The central north/south spine, perpendicular streets, northeast landmark and
southwest pavilion follow the reference's spatial arrangement. There is no
southern pond, shoreline, dock or water barrier; the bottom is walkable land.
The small fountain remains in the northwest civic square. The free-roam hub uses
this model; Chapter 1 retains its existing combat/progression route.

Interior variation is authored and stable, never re-randomized on entry. Furniture
has independent layers, material colors and collision. Residents should feel as
though they arranged their homes themselves.

Dialogue: ordinary residents offer a short observation, preference or useful hint.
Story beats use concise exchanges, contrasting personalities and occasional
physical comedy; danger still matters. Avoid every NPC delivering poetic lore,
repeating directions or sounding like a quest menu. All writing is original.

## Editing interiors

`src/game/story/roomLayouts.ts` contains all eight house arrangements. Each entry
has a furniture kind, position, wood/fabric/ceramic colors, and inspection text.
Move an entry to rearrange the room; change `fabric`, `wood`, or `ceramic` to recolor
only that material. The renderer creates one independent Graphics object per item,
above the floor; rugs stay below furniture. Collision and interaction points are
derived from the same item dimensions, then transformed with the compact room.

`makeFurniture` also returns `recolor({ fabric: 0x637f96 })` for runtime changes.
Palettes and placement remain stable between visits. The scene no longer contains
separate hardcoded drawing functions for every house.
