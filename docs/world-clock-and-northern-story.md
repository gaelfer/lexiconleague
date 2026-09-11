# Inkwell evening and the First Dictionary

The global clock remains at morning until the player reports the Tablet and the
rescued caretakers to Bellum. Finishing that conversation unlocks day 1 at dusk.
The permanent HUD clock is visible before and after the unlock.

- Morning: 5 minutes; afternoon: 6; dusk: 4; night: 10.
- Shared across scenes. Menus, dialogue, hidden browser tabs, and inactive play
  pause time. No offline catch-up. Sleep advances to the next morning.
- `worldClock` is optional on old saves. Existing progress is preserved.
- The southern village bell is an inspectable landmark with phase-change chimes.
- Residents use cardinal routes around solid footprints, with homes at night.
  Mira, Nell, Pip, Fenn, Tansy, Oren and Serif attend the tea tavern at dusk,
  joined by the bridgekeeper and gardener (absent from their Wordwood routines).
  Once tea is shared, the first gathering waits for Serif's departure conversation.
  Otherwise the tavern gathering recurs each dusk, and most villagers sleep at night.
  Morning and afternoon have different work/home destinations. Inn guests switch
  between morning work, afternoon preparation, evening tea and sleep. Bellum and
  Wren keep the Archive and night desk available; Luma has drawing, play and supper.
  Copper sleeps in a second bunk in room 201 and has coffee downstairs for the first
  minute of morning. An unfinished escort takes priority over her home routine.
  The Wordwood couple keep their 25/25/50 daytime activities, leave in the minute
  before dusk, and visibly walk home along Wordwood's paths afterward. Their travel
  positions and expected arrivals survive scene switches within the game session.

## Story sequence

1. Bellum invites the player to tea after the Wordwood report.
2. Share tea with Nell. On the first departure afterward, Serif walks down the
   central aisle and invites the player to accompany Copper the following morning.
   Leaving without tea does not trigger him. The completed invitation never repeats.
3. Sleep to skip the night, or wait until the next day, then speak to Copper at
   the east end of Inkwell Road. She waits if it is still the invitation day.
   Missing the appointed morning does not lock the quest; older invitations remain valid.
4. Enter Northmeadow at `(1168,16)`, above the survey camp. The hub is open grassland,
   not a winding corridor. Blotlings and skeletons appear at night and leave at dawn.
5. Enter the northern watchtower and clear four floors with Copper. Each floor saves
   its own completion and blocks upward travel until its guards surrender. Copper
   takes readable hits but cannot die. Bandits are ordinary Inklings, not Blotlings.
6. On floor four, inspect the dictionary and help Rook and Finch restore Mallow.
   Fighting alone does not count as the cure; the bandits become friends afterward.
7. Walk back downstairs, across the meadow and along the road. Copper follows the
   travelled route and walks onto her post before saying farewell. Her subsequent
   dialogue changes. Then report the witnessed cure and dictionary to Bellum.

The new arc uses `northernStory`; Arts remain locked. The Wordwood approach remains
safe after its boss. The meadow is a separate round-trip scene, not a replacement
for the existing road. Previously cured saves keep the outpost clear.

## Checks

`npx vitest run tests/world-clock.test.ts` covers timing, old saves and quest state.
`scripts/check-northern-story.cjs` exercises the story in an isolated browser save,
including menu pause, tea, the departure invitation and real sleep.
`scripts/check-tea-tavern.cjs` checks the gathering, clear aisles, solid furniture,
and leaving before tea. Independent 16×16 tea tiles are generated with the shared kit.
`check-outpost.cjs` covers all four combat floors, surrender, cure, night/dawn and return.
`check-copper-return.cjs` walks the actual road bends through farewell and new dialogue.
`check-daily-routines.cjs` checks sleeping households, coffee, the tavern and the couple's travel.
The bell, tower and furniture use foot-based foreground masks; floors stay below actors.
