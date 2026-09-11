# Adventure journal and saves

The story title screen is `/story`. New Game replaces only the story progress and inventory keys after confirmation. Continue uses the last saved area and its safe entry point, not an exact mid-combat position. Profile/cosmetics and story settings are separate. Existing checkpoint and expedition flags remain compatible.

The M menu freezes the Phaser loop and input without pausing/resuming individual scenes: their existing RESUME listeners perform travel actions. Canvas cleanup wakes a destroyed, sleeping loop so Phaser can process its deferred destruction. Closing the journal resets held keyboard keys.

## Inventory

`src/lib/story/inventory.ts` derives existing rewards from their original saved expedition flags and merges generic persistent supplies/key items. The herbal reserve shares its three charges with existing automatic combat healing; manual use is only allowed when a living player is hurt. Sword and bow remain available on their existing Q/R controls. Coins now persist through the existing inventory record.

Use `grantStoryItem(id, 'item', quantity)` for stacked supplies and `grantStoryItem(id, 'key')` for unique items. `consumeStoryItem(id)` validates quantity before decrementing. Add an authored name, glyph and effect to the inventory catalog when adding new usable supplies; unknown items are retained as inspectable keepsakes, never silently discarded.

## Quests and waypoints

The main journal is derived from legacy progress. Sidequests only appear after an NPC conversation calls `acceptSidequest(id)`; completed legacy objectives remain in the record. Bellum introduces the field-note request, while Wren introduces lodging and the missing caretakers. Register future sidequest definitions in `SIDEQUESTS` in `src/lib/story/adventure.ts`, with an ID, title, location, description, steps and optional waypoint `{area, x, y, label}` in world coordinates. NPCs call `acceptSidequest(id)` and gameplay calls `advanceSidequest(id, stepId)`. Steps are deduplicated and completion persists.

`trackedMainQuest` and `trackedSideQuests` persist independent selection of at most one main and two side quests. Completed sidequests release their slot, and a completed main quest advances to the next active main quest unless main tracking was explicitly disabled. `toggleQuestTracking` enforces the limit. Main quests are blue, side quests yellow, with textual labels as well as color. The left-rail Quests button opens category selectors; there is no duplicate bottom navigation entry. Tab toggles the right-side quest overlay during gameplay and retains normal focus navigation inside the paused journal.

`src/lib/story/waypoints.ts` chooses stage-specific markers for every tracked quest. Local charts use world coordinates, and the compass points toward the Wayfarer Gate when the objective is elsewhere. Inside buildings, the compass asks the player to return outside rather than interpreting indoor coordinates as outdoor coordinates. The regional road marker uses the same projection as the actual road geometry; the house marker identifies the player's house, not the road itself.

Local river courses come from `src/game/story/mapGeography.ts`, shared with the world renderers. Inkwell Road has a north–south river at x=512–640, crossed near y=304. Wordwood's river winds from the northern edge toward the west, with two crossings. No river is drawn through Inkwell Village. The broad regional chart deliberately simplifies Wordwood to one tree landmark and the road to a sideways route, with rivers extended through the surrounding landscape. `mapProjection.ts` keeps local geography and live player markers aligned; regional Wordwood markers identify its single landmark rather than exposing its internal layout.

The charts and item glyphs are original code-native pixel art. They have no remote dependencies or borrowed game assets. The map is informational and does not enable fast travel.

## Verification

Run `npm test`, `npx tsc --noEmit`, and `scripts/check-adventure-menu.cjs` with Playwright available. The browser script defaults to `http://localhost:3001`; `STORY_URL` overrides it. It uses a fresh browser context, never the player's live save, and writes review screenshots to `/tmp/adventure-*.png`.
