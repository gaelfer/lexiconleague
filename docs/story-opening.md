# Solo opening

The player wakes in the roadside cottage to Inkwell’s warning bell. Outside,
a masked Inkling flees east. Luma asks the player to rescue her mother, who is
trapped farther along the road. Luma follows the player's footsteps while the
player handles the fighting. She runs to greet Mira at the final clearing.

Clear all ten Blotlings and answer the three corrupted Word Seals. At the final
clearing, Mira, Pip, Bramble and Sir Serif thank the player. Serif explains
corrupted ink and directs the player to Scholar Vellum in the hub Archive.
Vellum explains the stolen Dictionary leaf and sends the player to investigate
Wordwood’s inscriptions and sanctuary, via the Wayfarer Gatehouse.

`StoryProgress.opening` stores woke → chase → scholar → wordwood. Defeated road
enemy IDs persist independently of seal checkpoints. A completed rescue unlocks
the village; finishing Vellum’s conversation unlocks chapter 2. Existing legacy
saves retain their area access and are not reset by this migration.

Entering the village persists `visitedInkwell`. Subsequent road visits contain
only Dame Copper, the bronze-painted road-watch knight, rather than the rescued
travellers. Speaking Inkling rigs make brief whole-pixel nods; their real face
art is preserved and they return to a planted pose between dialogue lines.

New saves start in WakeScene. Browser smoke test: scripts/check-story-opening.cjs
(Playwright, isolated storage, local Chrome). It uses keyboard input for waking,
movement and dialogue, and a seeded post-combat checkpoint for the rescue;
it is not a full combat playthrough. `?storyTest` exposes scene, position,
health and dialogue inspection plus a single-hit simulation in development only.

Home visits pause the outdoor scene. Interacting with the bed plays a rest
transition and restores all hearts; leaving carries the healing back to the
paused player without replaying the introduction or resetting progression.
