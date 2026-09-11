# Story combat loadout

The active design is `astra-minish-cap-combat-brief.md`.

- Q/R/F assign owned tools; new games own only the sword. A press slashes immediately, independent of hold duration. Bow release fires a normal or piercing charged arrow. Shield blocks one frontal hit per press; its first 150ms perfect-guards.
- Z/X use two distinct Arts. C consumes 100 Ink for the selected Inkburst. Keyboard-accessible HUD buttons also accept touch. Combat Loadout replaces the skill-point tree; legacy learnedSkills data is ignored safely.
- Inkwhirl sweeps; Quill Dash travels two valid tiles; Lunge staggers in a narrow line; Wordbind roots ordinary enemies for two seconds. Guardians resist roots. Dashes check every tile and diagonal corner.
- Resolve: four maximum hearts, 25% less Ink gain. Recall: first-time seal reward adds half a heart and extra Ink. Clarity: slower charged arrows with longer reach and one extra pierce.
- Redline sweeps up to four valid tiles, hitting each enemy once as the player travels. Marginal Storm fires three three-arrow waves. Final Draft absorbs three hits for up to four seconds before bursting; it stays locked until the shield is owned.
- No Lexica shop or shield acquisition is added before that region exists.

## Luma: The green ribbon

Talk to Luma at the mapmaker's home in Inkwell. She lost a sketchbook while fleeing. Find it by the road orchard, cut its snagged briars with the sword, and return it to her. Speak to Mira outside afterward; she gives the player her old travelling bow. This is not Luma's weapon. The quest is discoverable only through conversation, has changing map waypoints, and saves each step. The returned book leaves the inventory; the bow remains owned and can be assigned to any tool slot.

## Visuals and verification

Original equip-card badges for all ten Arts/Rings/Inkbursts live in CombatGlyph, using restrained paper, ink, green, and red. Loadout choices and HUD share the badges.

Run `npm test`, `npx tsc --noEmit`, and `npm run lint`. `scripts/check-combat-loadout.cjs` uses isolated browser storage to exercise the quest, input, grid dash, loadout, and future-shield fixture without touching a player's save. Older gear/skill scripts predate this replacement; this is the current combat acceptance script.
