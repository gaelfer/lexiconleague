# Lexicon League story combat redesign — implementation brief

## Your task

Replace the current permanent Sword Skills upgrade path with a small, responsive
Minish Cap-style combat loadout. The target is a top-down action-adventure with
clear directional attacks, readable enemy tells, combat tools that also matter
in exploration, and a small amount of player expression.

Do **not** make this a literal Cuphead combat system. Cuphead is a reference for
responsiveness, telegraphs, commitment, and satisfying loadout choices. This game
uses committed, tile-to-tile movement and must retain its top-down adventure-game
identity.

## Non-negotiable design principles

1. The sword is the hero's permanent primary weapon. Do not introduce Sword I /
   II / III damage ladders or generic numerical weapon upgrades.
2. The player selects two active Arts, one Heart Ring passive, and one Inkburst
   super. These must have clearly different jobs.
3. Sword, bow, and shield are tools. They must be useful in both combat and
   exploration/puzzles; they are not just alternate damage numbers.
4. Preserve the existing one-tile, smooth-interpolated movement model. A dash
   must resolve to valid grid tiles, stop at solid walls, and never create
   diagonal corner-cutting.
5. Preserve avatar cosmetics, weapon grip alignment, pixel-art rendering, and
   keyboard accessibility. Read `docs/story-mode-art-direction.md` in full
   before changing player presentation.
6. Remove the old skill-point economy and the linear Spin → Steady Focus /
   Inkwhirl tree. Old saves must still load safely.

## Desired player kit

### Base tools

The player can assign owned tools to the existing `Q`, `R`, and `F` quick-tool
slots. Keep those assignments configurable in the Inventory menu.

- **Sword:** a quick directional melee slash. It is always the reliable close
  range option. A normal sword tap must never become a dead input because the
  player held the key slightly too long.
- **Bow:** tap fires a normal arrow. Hold and release fires a charged arrow
  after a clear visual/audio-ready cue. A charged arrow should pierce or stagger
  rather than merely deal a larger number. Drawing is a brief commitment.
- **Shield:** blocks one frontal hit with recovery. Its first roughly 150 ms is
  a perfect-guard window: a successful perfect guard negates damage, visibly
  counters or exposes the attacker, and adds Ink meter. Hits from the side/rear
  do not count as blocks. It should later be usable for projectile and world
  interactions.

Do not require all three tools to be equipped at once. The normal loadout can
leave a tool unassigned. The sword remains owned and should be the default
starting tool.

### Arts

The player equips exactly two different Arts. They use dedicated action inputs
that cannot conflict with tool assignment; choose a clear keyboard and
controller-friendly mapping and show it in the HUD/menu. Arts have visible
cooldowns and should have an intentional recovery window.

Initial Arts:

| ID | Purpose | Behaviour |
| --- | --- | --- |
| `inkwhirl` | crowd control | Sword sweep around the player; brief recovery leaves them exposed. |
| `quill-dash` | movement / evasion | Move exactly two valid tiles in facing direction; walls stop it. |
| `lunge` | precision / stagger | Narrow long sword thrust; strong stagger, but recovery occurs even on a miss. |
| `wordbind` | control | Seal nearby ordinary enemies in place for two seconds; guardians resist it. |

Avoid turning every Art into another AoE attack. They must create distinct
answers to crowds, danger, spacing, and durable targets.

### Heart Rings

The player equips one Ring, a passive with a readable upside and constraint.
Do not use plain percent-damage bonuses.

Initial Rings:

| ID | Effect |
| --- | --- |
| `resolve` | +1 maximum heart; Ink meter gain is 25% slower. |
| `recall` | A first-time correct Word Seal answer restores half a heart and grants extra Ink; no passive combat benefit. |
| `clarity` | Charged arrows travel farther and pierce an extra foe, but take one second to charge rather than 0.7 seconds. |

Health UI, healing, scene transitions, deaths, and rest behavior must respect
the selected maximum-heart value.

### Inkbursts

The player equips one Inkburst. It consumes a full 100-point Ink meter and is
an emergency or boss-opening tool, not a frequent attack. Gain meter from
combat, with meaningful bonuses for perfect guards and Word Seal success.

Initial Inkbursts:

| ID | Tool identity | Behaviour |
| --- | --- | --- |
| `redline` | Sword | Rush up to four valid tiles in a line, striking each enemy once; solid walls stop it. |
| `marginal-storm` | Bow | Three waves of spectral arrows sweep a wide lane. |
| `final-draft` | Shield | A four-second ward absorbs three hits, then bursts outward. Only selectable once the shield is owned. |

Use a single, obvious HUD meter. The selected Inkburst must be unavailable until
its associated tool is owned.

## Existing implementation scaffolding

Some data definitions already exist in `src/lib/story/combatLoadout.ts`:

- `ARTS`, `RINGS`, and `INKBURSTS`
- `CombatLoadout` and default / validation helpers
- ring-based heart, bow charge, arrow pierce, and Ink-meter helpers

Review that file critically; it is scaffolding, not evidence that the feature is
wired up. Complete, revise, or simplify it as needed. Keep persisted data
backwards compatible in `StoryProgress`.

Relevant current integration points:

- `src/game/entities/Player.ts` — input, sword/bow pose, combat events, health.
- `src/game/world/expeditionCombat.ts` and `src/game/scenes/DungeonScene.ts` —
  enemy hit detection and scene-scoped combat listeners.
- `src/lib/story/equipment.ts` — owned gear and Q/R/F slot assignment.
- `src/components/story/AdventureMenu.tsx`, `InventoryScreen.tsx`, and
  `SkillsScreen.tsx` — journal UI that needs a loadout replacement.
- `src/components/story/HUDOverlay.tsx` and `StoryGameCanvas.tsx` — health and
  combat HUD state.
- `src/lib/story/skills.ts` and `src/game/swordInput.ts` — legacy system to
  remove or retire cleanly.

## Migration and UI requirements

- Replace the `Skills` page with a **Combat Loadout** page. It must let the
  player select two distinct Arts, one Ring, and one valid Inkburst.
- Do not show skill points, permanent upgrades, or a linear skill path.
- Existing saves containing `learnedSkills` must not error. Ignore or migrate
  that field into safe defaults; never grant an unintended advantage.
- Explain controls in plain language. The player must be able to see the tool,
  Art, Ring, Inkburst, readiness/cooldown, and Ink-meter state without opening
  source code.
- Retain mobile/touch accessibility patterns already used by the project.

## Combat feel requirements

- Enemies need readable attack windups and distinct windows for sword pressure,
  shield counters, bow spacing, and Arts. Do not compensate for shallow enemy
  behavior by only inflating damage values.
- Every action needs immediate visual feedback, an effect at the hit frame, and
  a clear end/recovery state.
- A partial hold must not silently cancel the ordinary sword attack. If charging
  is used, release behavior must remain legible and forgiving.
- Keep the existing art direction: pixel-snapped presentation, visible player
  cosmetics, readable silhouettes, and no fullscreen visual noise.

## Verification

Add or update focused Vitest coverage for:

- loadout defaults and validation (two distinct Arts; burst tool ownership);
- legacy save behavior;
- ring maximum hearts, bow-charge timing, and arrow pierce behavior;
- Ink meter clamping and Ring of Resolve gain penalty;
- tool / Art action selection rules;
- ordinary sword releases never producing the prior silent partial-charge
  cancellation.

Run the relevant tests plus `npm run lint`. For visual or interaction changes,
run the game locally and inspect the affected scene with the player visible;
report what was visually checked and what was not.

## Definition of done

The player can make a meaningful pre-combat choice with two Arts, a Ring, and an
Inkburst; sword, bow, and shield each have a separate tactical identity; the
former upgrade tree and skill-point framing are gone; and the result feels like
a responsive Zelda/Minish Cap-style adventure combat system rather than a stat
upgrade menu.
