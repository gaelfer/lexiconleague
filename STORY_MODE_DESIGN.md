# Lexicon League — Story Mode Design Document

> **Status:** Pre-development. This document governs all story mode decisions before a single line of code is written.
> **Approach:** Build Chapter 1 as a proof of concept after this doc is finalized.

---

## 1. Vision

Story mode is a single-player, top-down Zelda-style dungeon crawler embedded in Lexicon League. Players explore a hand-crafted world using real-time 8-way movement, combat with multiple weapons, shops, an inventory and equipment system, and a full in-game menu — while vocabulary and punctuation questions serve as the core progression mechanic: locking doors, powering boss fights, and guarding treasures.

**Tone:** Light-hearted and adventurous. Think early Zelda (Link's Awakening, Minish Cap) — not dark, but genuinely meaningful.

**Emotional arc (all three):**
- **Becoming** — A regular inkling steps up and grows into a hero
- **Exploring** — A rich, curious world with history and secrets
- **Saving** — The stakes escalate from a village to the entire world of language

---

## 2. Controls

### Desktop (Keyboard)
| Input | Action |
|-------|--------|
| WASD / Arrow keys | 8-way movement |
| Z | Sword attack (tap = swing, hold 0.7s then release = spin attack) |
| X | Secondary item (bow: shoots arrow / shield: hold to block, tap to bash) |
| A / E / Space | Interact (talk, open chest, read sign, activate checkpoint) |
| Escape / Tab | Open/close menu |

### Desktop (Gamepad)
| Input | Action |
|-------|--------|
| Left stick / D-pad | 8-way movement |
| B button | Sword attack |
| Y / L button | Secondary item |
| A button | Interact |
| Start | Menu |

### Mobile (Touch)
| Input | Action |
|-------|--------|
| Left virtual joystick | 8-way movement |
| Sword button (right side) | Sword attack |
| Item button (right side) | Secondary item |
| Context button (appears near interactables) | Interact |
| Menu icon | Menu |

### 8-Way Movement
Full 8-directional movement (all four cardinal directions + diagonals). The player's sprite faces the movement direction. Attacks fire in the currently faced direction. Auto-lock overrides facing to target the nearest enemy when in attack range.

---

## 3. Weapons & Equipment

The combat system is modeled closely on The Legend of Zelda: The Minish Cap.

### Primary Weapon — Sword (always equipped)
The sword is never swapped out. It lives on the attack button (Z / B) permanently.

**Tap attack:** Single sword swing in the faced direction. Fast, short-range.

**Spin attack (hold + release):**
- Hold the attack button for 0.7 seconds — player begins to glow and spin animation charges
- Release → 360° sweeping spin slash hits all enemies within melee range
- Deals 2× normal sword damage
- Rewards players who read the room and time their swing

**Auto-lock targeting:**
- When an enemy is within attack range, the player auto-faces and locks onto the nearest one
- Prevents pixel-precision frustration — you face the enemy, then swing
- Lock is released when the enemy dies or moves out of range

### Secondary Item Slot — Bow or Shield
One secondary item is active at a time, equipped via the inventory. The item button (X / Y) behavior changes based on what's equipped.

**Bow (Ranged) — unlocked Chapter 3**
- Tap item button → shoots one ink arrow in the faced direction (or toward locked target)
- Arrows are limited; replenished by Ink Vials
- Effective against ranged enemies and enemies across gaps or behind barriers

**Shield (Defensive) — unlocked Chapter 6**
- Hold item button → shield raised, blocks all frontal hits (projectiles, enemy swings)
- Release → shield lowers; player can move freely while shielding
- Tap item button → shield bash: short-range stun on the nearest enemy, no damage but opens them up for a sword follow-up
- Cannot attack while shielding

### Hit Feedback
Every sword hit triggers:
- **White flash** — enemy sprite flashes white for 1–2 frames (universal "you hit it" signal)
- **Knockback** — enemy is pushed back in the direction of the swing, creating space and making each hit feel physical

No screen shake or ink splatter — keeping it clean and readable.

### Weapon Switching
- Secondary item is swapped in the Equipment menu tab
- No mid-combat hot-swap — players choose their secondary before entering a room
- Encourages tactical thinking: is this a bow room or a shield room?

---

## 4. Shops & Economy

### Currency: Lexicoins
- Story mode's exclusive currency
- Earned by: defeating enemies (each drops a small amount), opening chests, completing chapters
- Cannot be exchanged with Ink Drops — separate economies
- Lost on death? **No** — Lexicoins persist across deaths. No punishment for dying beyond restarting from checkpoint.

### Shop Locations
Each region has at least one shop. Shops appear as named NPCs in safe areas (hub rooms between dungeons, or inside Inkwell Village).

| Region | Shop name | Location |
|--------|-----------|----------|
| Inkwell Village | The Inkwell General | Village square, always accessible |
| Wordwood Forest | The Wandering Merchant | Found in a clearing between Chapters 3 and 4 |
| Forgotten Ruins | The Ruin Keeper | Unlocked after clearing Chapter 6 |
| Shadow Fortress | The Defector | A former minion who turned against the Red Inkling; sells near Chapter 9 start |

### Shop Inventory

#### Weapons & Gear
| Item | Cost | Notes |
|------|------|-------|
| Iron Sword | 80 Lexicoins | Upgrade from starter sword — higher damage |
| Word Blade | 220 Lexicoins | Strongest sword tier. Glows with ink energy |
| Sharpened Arrows | 60 Lexicoins | Increases bow damage |
| Reinforced Shield | 150 Lexicoins | Shield takes more hits before breaking |

#### Consumables
| Item | Cost | Notes |
|------|------|-------|
| Heart Potion (small) | 20 Lexicoins | Restores 1 heart |
| Heart Potion (large) | 50 Lexicoins | Restores 3 hearts |
| Ink Vial | 15 Lexicoins | Refills bow arrows |
| Speed Draught | 30 Lexicoins | Temporary movement speed boost (~15 seconds) |
| Answer Shield | 80 Lexicoins | Guarantees 1 correct answer in the next question encounter |

#### Lore / Hints
| Item | Cost | Notes |
|------|------|-------|
| Region Map | 25 Lexicoins | Reveals the full map of the current region (removes fog of war) |
| Dungeon Hint | 40 Lexicoins | NPC gives a hint about the current chapter's puzzle or boss weakness |
| Lore Tome | 60 Lexicoins | Unlocks a lore entry in the Story Archive |

### Inventory Limits
- Consumables: max 5 of each type carried at once
- Gear/weapons: no limit (all purchased weapons are kept permanently)
- Key items (story items, maps): no limit

---

## 5. In-Game Menu

Opened with Escape / Tab / Start. Pauses Phaser entirely.

### Menu Tabs

#### Map
- Shows the current chapter's dungeon layout
- Rooms visited are revealed; unvisited rooms shown as outlines
- Icons indicate: checkpoint, shop, boss room, exit
- Region map purchasable at shops to remove fog of war

#### Inventory
- Grid of carried consumables and key items
- Select a consumable → use it immediately (even from menu)
- Key items (lore books, story objects) are readable here

#### Equipment
- Currently equipped weapon displayed with stats
- Switch between unlocked weapons (Sword / Bow / Shield)
- View weapon upgrade path and current tier

#### Save & Quit / Settings
- **Save & quit** — saves progress at current checkpoint and returns to world map
- **Difficulty** — change difficulty (takes effect at next chapter start)
- **Controls** — remap keys (desktop)
- **Audio** — music and SFX volume

---

## 6. Characters

### The Player
- Uses the player's existing Lexicon League avatar (base, color, eyes, accessory, aura)
- Player chooses their name at the start of story mode
- Minimal defined personality — the avatar is the player

### The Companion *(TBD name)*
- The player's best friend — a fellow inkling
- Corrupted in the opening scene, rescued at the end of Chapter 2
- Travels with the player for the rest of the story
- **Personality:** Upbeat, slightly anxious, occasionally sarcastic — the emotional heart of the story
- Serves as hint-giver, lore explainer, and comic relief
- Rendered using the existing inkling SVG system with a distinct color/style
- Does not fight — stays at the player's side during exploration, reacts during dialogue

### The Red Inkling (Villain)
- A corrupted inkling of unknown origin
- **Motivation:** Mysterious until the very end
- Glimpsed but never fully encountered until Chapter 10:
  - Chapter 4: A flash of red seen fleeing into the forest
  - Chapter 8: A cryptic message left in the ruins: *"You're closer than you think."*
  - Chapter 9: Voice heard but not seen, taunting through his fortress
  - Chapter 10: Full confrontation and reveal
- His minions: corrupted inklings, corrupted animals, and corrupted word-creatures

### Enemy Types
| Enemy | Region | Behavior |
|-------|--------|----------|
| Corrupted Inkling | All | Basic patrol, melee attack on sight |
| Corrupted Bunny | Village, Forest | Fast dash toward player, low HP |
| Corrupted Bird | Village, Forest | Ranged ink spit, stays at distance |
| Ink Wolf | Forest | Heavy slow charge, high HP |
| Word-Wraith | Ruins | Floats, phases through walls briefly |
| Ruin Guardian | Ruins | Slow but high damage, telegraphed attacks |
| Inkling Soldier | Fortress | Armored, blocks frontal attacks |
| Red Lieutenant | Fortress | Mini-boss: multiple attack patterns |

---

## 7. World & Regions

### Region 1: Inkwell Village (Chapters 1–2)
- **Vibe:** Cozy, safe, familiar. Tutorial region.
- **Setting:** Ink canals, word-powered lanterns, a library at the center. When corruption hits, signs scramble and the ink runs red.
- **Tileset:** Tiny Swords village tiles
- **Shop:** The Inkwell General (sword, heart potions, ink vials)

### Region 2: Wordwood Forest (Chapters 3–5)
- **Vibe:** Lush but eerie. Words carved into bark. Strange magic.
- **Setting:** Dense forest with dark ink rivers, glowing word-trees, crumbled ancient signposts.
- **Tileset:** Tiny Swords forest/nature tiles
- **Shop:** The Wandering Merchant (bow unlocked here, arrows, speed draughts)

### Region 3: Forgotten Ruins (Chapters 6–8)
- **Vibe:** Ancient, awe-inspiring. Language once built civilizations here.
- **Setting:** Crumbling temples inscribed with language, underground chambers, a grand library turned dark.
- **Tileset:** Tiny Swords ruins/stone tiles
- **Shop:** The Ruin Keeper (shield unlocked here, upgraded gear, answer shields)

### Region 4: Shadow Fortress (Chapters 9–10)
- **Vibe:** Dark, imposing. Final stretch.
- **Setting:** A fortress of solidified corrupted ink. Language carved into walls is twisted — words mean the opposite.
- **Tileset:** Tiny Swords dark/fortress tiles
- **Shop:** The Defector (best consumables, Word Blade, lore tomes)

---

## 8. Chapter Breakdown

| # | Region | Boss | Key Story Beat |
|---|--------|------|----------------|
| 1 | Inkwell Village | None | Corruption begins. Friend is struck by red ink and runs. Player pursues. |
| 2 | Inkwell Village | Mini-boss (corrupted inkling) | Companion rescued. Together they decide to follow the Red Inkling's trail. |
| 3 | Wordwood Forest | None | First full multi-room dungeon. Bow unlocked. Forest is stranger than expected. |
| 4 | Wordwood Forest | None | Signs of the Red Inkling's recent passage. Flash of red in the trees. |
| 5 | Wordwood Forest | Full boss (corrupted forest creature) | Forest guardian defeated. First major victory. |
| 6 | Forgotten Ruins | None | Ruins reveal world history. Shield unlocked. Language was the source of all power. |
| 7 | Forgotten Ruins | Mini-boss (word-wraith) | Red Inkling's trap. Companion recaptured. Player alone. |
| 8 | Forgotten Ruins | Full boss (ancient ruin guardian) | Guardian defeated. Cryptic message found. Companion rescued. |
| 9 | Shadow Fortress | Lieutenant boss | Fortress gauntlet. Red Inkling's voice heard but he hides. |
| 10 | Shadow Fortress | FINAL BOSS (Red Inkling, 3 phases) | Full confrontation. Mystery revealed. World saved. |

---

## 9. Chapter Structure

Every chapter follows this flow:

```
1. Opening dialogue
   → Short story scene: companion + player, or NPC
   → Sets emotional tone

2. Dungeon exploration
   → 3–5 rooms of real-time 8-way movement
   → Enemies patrol and attack on sight
   → Player uses sword/bow/shield to fight
   → Questions gate locked doors, chests, and the boss room

3. Climax (boss chapters only)
   → Boss fight with full question battle UI

4. Closing scene
   → Dialogue beat: what changed, what's next
   → Lexicoin reward + chapter clear bonus

5. Rewards
   → XP, ink drops, lore entry, cosmetic (on first clear)
```

---

## 10. Gameplay Mechanics

### Real-Time Movement
- 8-directional movement (all cardinals + diagonals)
- Player sprite faces movement direction; auto-lock overrides to face nearest enemy in attack range
- **Enemies deal real damage** during exploration — consumables have genuine purpose

### Enemy Aggro — Vision Cone System
Modeled on classic Zelda enemy behavior:
- Each enemy has a **frontal vision cone** — a forward-facing detection arc (~120° wide, variable depth by enemy type)
- Walk into the cone → enemy aggros, stops patrolling, chases the player
- **Approach from behind** → enemy doesn't see you → first sword hit is a free backstab (no alert before the hit)
- Leave the room → enemy resets to original patrol path
- Some enemy types (Word-Wraiths, birds) have wider or 360° detection — no safe angle

### HP System (Exploration)
- Player has hearts during dungeon exploration (not just boss fights)
- Hearts lost when enemy attacks connect
- Restored by: heart potions (inventory), checkpoints (full restore), or some chests
- Run out of hearts → respawn at last checkpoint, lose no Lexicoins

### Three Types of Question Encounters

#### 1. Word Locks (Doors)
- Locked doors marked with a glowing ink symbol
- Press Interact (A/E) near door → action pauses → question popup
- **Correct:** Door opens permanently for the session
- **Wrong:** 3-second cooldown, then retry. No damage penalty.

#### 2. Word Chests
- Chests contain Lexicoins, lore entries, consumables, or weapon unlocks
- Press Interact → question popup
- **Wrong:** Chest stays closed, retry available. No penalty.

#### 3. Boss Gates + Boss Fights
- Boss room requires a key question to unlock the gate
- Always a harder question relative to chosen difficulty
- After the gate: Phaser pauses → Boss Fight UI takes over full screen

### Boss Fight UI
- Dedicated battle screen separate from the dungeon
- Boss displayed with HP bar and animated portrait
- Player has heart system (can carry over from dungeon entry, or reset — TBD)
- Timer per question (difficulty-dependent)
- **Correct:** Deals damage to boss HP
- **Wrong:** Boss attacks — player loses a heart
- **Boss phases:** At HP thresholds (e.g. 66%, 33%), short dialogue plays and questions get harder
- Defeat → story cutscene → return to dungeon map

### Consumable Usage
- Usable from inventory menu (pauses game) or via quick-select (TBD)
- **Heart Potion** — restore hearts
- **Ink Vial** — refill bow arrows
- **Speed Draught** — movement speed +50% for 15 seconds
- **Answer Shield** — next question auto-answers correctly (can be used mid-boss fight)

### Difficulty

Set when starting story mode. Changeable before any chapter begins.

| Difficulty | Question grade | Boss HP | Starting hearts | Answer timer |
|------------|---------------|---------|-----------------|--------------|
| Easy | Grades 3–4 | Low | 5 | 20s |
| Medium | Grades 5–6 | Medium | 3 | 15s |
| Hard | Grade 7+ / AP | High | 2 | 10s |

### Checkpoint System
- Glowing ink pool — press Interact to activate
- Saves: rooms cleared, doors opened, chests found, Lexicoins, checkpoint location
- Restores full hearts on activation and on respawn
- One checkpoint per chapter (roughly mid-point)

---

## 11. Narrative — Story Beats

### Opening (Chapter 1)
The player's avatar wakes up in Inkwell Village. An ordinary morning — canals flow smoothly, word-lanterns glow warmly. They step outside.

The ink in the eastern canal is turning red. A storefront sign scrambles — letters rearranging into nonsense. A sound — not quite a scream, more like a word dissolving.

The player finds their companion in the village square. Before they can speak, a wave of red ink washes over the companion — corrupting them. They turn and run toward the Wordwood Forest.

The player follows.

### The Companion Rescued (Chapter 2)
The companion is held by a corrupted inkling mini-boss. Defeating it breaks the hold. The companion snaps back — confused, scared, missing hours of memory — but remembers a figure: tall, crimson, ink-black eyes, watching from the treeline.

Together: they go after the Red Inkling.

### The Forest (Chapters 3–5)
The Wordwood Forest is stranger than either expected. Words carved into bark pulse with energy. Ink rivers glow. The deeper they go, the more corrupted things become.

Chapter 4: Fresh corruption, animals that fled, a corrupted signpost pointing wrong. The Red Inkling was here. A flash of red — gone before they can react.

Chapter 5: A corrupted forest creature blocks the path. Defeating it clears the way. The companion finds an ancient symbol — it matches something from the ruins described in old library books.

### The Ruins (Chapters 6–8)
Language wasn't just communication here — it was power. Civilizations were built by inscribing words into stone. The companion pieces it together: whoever corrupted the ink did it deliberately. They knew exactly what they were doing.

Chapter 7: A trap. Word-wraiths swarm. The companion is taken again. The player pushes through the ruins alone.

Chapter 8: Ancient guardian defeated. Companion freed. Scratched into the rubble in corrupted ink:

*"You're closer than you think."*

### The Fortress (Chapters 9–10)
The Shadow Fortress shouldn't exist. Every inscription inside is twisted — words mean the opposite of what they say.

Chapter 9: The Red Inkling's voice echoes through empty halls. His lieutenant falls.

Chapter 10: The final room. The confrontation. His mystery is revealed across three boss phases, each one uncovering another layer.

The ending: the ink clears. The world breathes.

*(Full dialogue scripts — TBD during development)*

---

## 12. Dialogue Style

- Short dialogue boxes, 1–3 lines per beat (Link's Awakening / Mario RPG style)
- Character portrait alongside text (inkling avatar rendered at small size)
- No voice acting — text with optional sound effects
- **Companion:** Warm, nervous, occasionally dry
- **Player:** Mostly silent; occasional single-word responses
- **Red Inkling:** Cryptic, unhurried, slightly off — like corrupted language
- **Shop NPCs:** Friendly and brief — flavor text + shop prompt
- **Other NPCs:** One or two lines of useful info, hints, or world flavor

---

## 13. Rewards

| Trigger | Reward |
|---------|--------|
| Complete any chapter | XP + ink drops |
| First clear of each chapter | Lore entry unlocked |
| Complete Region 1 (Ch. 1–2) | Exclusive village-themed accessory |
| Complete Region 2 (Ch. 3–5) | Exclusive forest-themed accessory |
| Complete Region 3 (Ch. 6–8) | Exclusive ruins-themed accessory |
| Complete Region 4 / finish game | Exclusive fortress cosmetic + **"World Saver"** profile title |
| Perfect chapter (all word locks first-try) | Bonus Lexicoins + bonus ink drops |

Lore entries unlock in a **Story Archive** on the world map page.

---

## 14. Technical Architecture

### Game Engine

**Phaser 3** embedded in Next.js as a React component.

> **Engine decision rationale (2026-02-22, revised):** Pivoted from Excalibur.js to Phaser 3.
> - Phaser 3 has a larger ecosystem, more tilemap tooling, and built-in arcade physics
> - SSR/HMR friction handled cleanly with `dynamic(() => import(...), { ssr: false })`
> - TypeScript types ship with the `phaser` package (no separate `@types/phaser`)
> - Tilemap support is built-in — no plugins required (unlike Excalibur's `@excaliburjs/excalibur-tiled`)

**Division of responsibility:**
- Phaser handles: game loop, 8-way movement, Arcade physics collision, room/tilemap rendering, enemy AI, camera follow, sprite animation
- React overlay handles: question popups, boss fight UI, in-game menu, dialogue boxes, shop UI, HUD
- Communication bridge: shared `EventBus` (a `Phaser.Events.EventEmitter` instance) — Phaser scenes emit events, React subscribes via `useEffect`

**Key bridge events:**

| Direction | Event | Payload |
|-----------|-------|---------|
| Phaser → React | `player-near-door` | `{ doorId, questionType }` |
| Phaser → React | `health-changed` | `{ hearts: number }` |
| Phaser → React | `lexicoins-changed` | `{ amount: number }` |
| Phaser → React | `show-dialogue` | `{ lines, portrait }` |
| Phaser → React | `chapter-complete` | `{ chapterId }` |
| Phaser → React | `current-scene-ready` | `scene: Phaser.Scene` |
| React → Phaser | `question-result` | `{ correct: boolean, doorId: string }` |
| React → Phaser | `use-consumable` | `{ itemId }` |
| React → Phaser | `game-paused` / `game-resumed` | — |

**Next.js integration:**
```tsx
// app/story/[chapterId]/page.tsx
const StoryGameCanvas = dynamic(
  () => import('@/components/story/StoryGameCanvas'),
  { ssr: false }
);
```

### Level Design

**Tiled** (free desktop app) for visual room authoring → export as JSON → loaded via Phaser's built-in tilemap API.

- Tilesets: Tiny Swords (Free Pack) at `/public/Tiny Swords (Free Pack)/`
- Each dungeon room = one Tiled map file
- Collision layer: tiles with `collides: true` custom property → `layer.setCollisionByProperty({ collides: true })`
- Entity layer: enemy spawn points, chest positions, door locations, checkpoint — placed as Tiled objects → `map.findObject()` / `map.createFromObjects()`

**Phase 1:** Rooms built programmatically with Phaser graphics (no Tiled dependency). Tiled maps introduced in Phase 2.

### Persistence

Story progress is stored in two places, kept in sync:

1. **`localStorage`** — primary write target, instant reads, works without auth
2. **Supabase** — synced on chapter complete and on page unload for authenticated users

```typescript
// Mirror of the existing UserProfile storage pattern
interface StoryProgress { ... }   // see §13 Data Models
interface StoryInventory { ... }  // see §13 Data Models
```

### New Routes
```
/app/story                    → World map + chapter select + Story Archive
/app/story/[chapterId]        → Playable chapter
```

### New File Structure
```
src/
├── app/story/
│   ├── page.tsx                     → World map / chapter select
│   └── [chapterId]/
│       └── page.tsx                 → Chapter wrapper (loads Phaser + React overlays)
│
├── components/story/
│   ├── StoryGameCanvas.tsx          → Phaser React wrapper (dynamic import, ssr:false)
│   ├── WordLockModal.tsx            → Question popup overlay
│   ├── BossFightScreen.tsx          → Full boss battle UI
│   ├── DialogueBox.tsx              → NPC / character dialogue system
│   ├── StoryWorldMap.tsx            → Chapter select map with region progress
│   ├── StoryArchive.tsx             → Lore entry collection viewer
│   ├── StoryMenu.tsx                → In-game pause menu (Map / Inventory / Equipment / Settings)
│   ├── ShopModal.tsx                → Shop UI overlay
│   └── HUDOverlay.tsx               → In-game HUD (hearts, Lexicoins, equipped weapon)
│
├── lib/story/
│   ├── chapters.ts                  → Chapter definitions, room configs, story beats
│   ├── dialogue.ts                  → All dialogue scripts
│   ├── enemies.ts                   → Enemy types, stats, AI behavior config
│   ├── shops.ts                     → Shop inventories per region
│   ├── items.ts                     → All item/consumable definitions
│   └── progress.ts                  → Save/load story progress + inventory (localStorage + Supabase)
│
└── game/
    ├── EventBus.ts                  → Shared event emitter (Phaser ↔ React bridge)
    ├── PhaserGame.ts                → Game factory (createGame function)
    ├── scenes/
    │   ├── BootScene.ts             → Generates placeholder textures, transitions to DungeonScene
    │   ├── DungeonScene.ts          → Main dungeon (rooms, movement, doors, camera)
    │   ├── VillageScene.ts          → Chapter 1–2 (Phase 2+, Tiled maps)
    │   ├── ForestScene.ts           → Chapter 3–5 (Phase 2+)
    │   ├── RuinsScene.ts            → Chapter 6–8 (Phase 2+)
    │   └── FortressScene.ts         → Chapter 9–10 (Phase 2+)
    ├── entities/
    │   ├── Player.ts                → 8-way movement, weapon system, HP
    │   ├── Enemy.ts                 → Base enemy class
    │   ├── EnemyTypes.ts            → Specific enemy behaviors (patrol, aggro, vision cone)
    │   └── Companion.ts             → Follows player, dialogue trigger
    └── systems/
        ├── RoomSystem.ts            → Room loading, door/chest states, Tiled map parsing
        ├── CheckpointSystem.ts      → Checkpoint activation and save
        └── CombatSystem.ts          → Damage, hit detection, knockback, enemy death
```

### Data Models

```typescript
// Story-wide progress
interface StoryProgress {
  playerName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  currentChapter: number;
  completedChapters: number[];
  chapterCheckpoints: Record<number, string>;
  unlockedLore: string[];
  claimedRewards: string[];
}

// Player inventory and economy
interface StoryInventory {
  lexicoins: number;
  equippedWeapon: 'sword' | 'bow' | 'shield';
  unlockedWeapons: string[];          // weapon IDs owned
  consumables: Record<string, number>; // itemId → quantity
  keyItems: string[];                  // story item IDs
  purchasedUpgrades: string[];         // upgrade IDs
}
```

Both stored in `localStorage` (same pattern as `UserProfile`), synced to Supabase for authenticated users.

### Assets
- **World tiles:** Tiny Swords (Free Pack) — `/public/Tiny Swords (Free Pack)/`
- **Player + companion + shop NPCs:** Existing inkling SVG system
- **Enemies:** Tiny Swords enemy sprites for animals + custom corrupted inkling variants
- **UI:** Existing Lexicon League design system
- **Item icons:** Custom pixel art or Tiny Swords items (TBD)

---

## 15. Open Questions (TBD)

- [ ] Companion's name and visual style (fixed design or avatar-like?)
- [ ] Full dialogue scripts for all 10 chapters
- [ ] Exact room layouts and tilemap designs for all chapters
- [ ] Enemy AI behavior patterns (patrol routes, aggro radius, attack animations)
- [ ] Red Inkling's Chapter 10 reveal — design the backstory carefully
- [ ] Quick-select consumables during gameplay (hold key + pick item, or hotbar?)
- [ ] Does player HP carry into a boss fight, or reset at boss gate?
- [ ] Shop NPC visual designs (are they also inklings? Custom sprites?)
- [ ] Sound design: music per region, combat sounds, question feedback
- [ ] Story mode question bank — use existing questions or add story-specific ones?
- [ ] Item icons and asset source for shop UI
- [ ] Multiplayer party support (deferred to v2)

---

## 16. Development Phases

**Phase 1 — Foundation**
- World map / chapter select UI at `/app/story`
- Dialogue system component
- Story progress + inventory save/load
- Chapter 1 proof of concept: 3 rooms, 8-way movement, sword combat, word locks, closing dialogue

**Phase 2 — Core Systems**
- Full Phaser integration: 8-way movement, enemy AI, tilemap rooms, collision
- Inventory + equipment menu
- Shop modal wired to Lexicoin economy
- HUD overlay (hearts, Lexicoins, equipped weapon icon)
- Checkpoint system
- Consumable usage in-game

**Phase 3 — Combat & Questions**
- Bow and shield weapon implementations
- Boss fight UI and question system wired to Phaser
- Boss phase transitions with dialogue
- Word chest encounters

**Phase 4 — Content**
- All 10 chapters: rooms, enemies, dialogue, shops
- All lore entries written
- Boss designs for all 5 boss encounters
- All shop inventories configured

**Phase 5 — Polish**
- Animations (walk cycles, attack, enemy death, chest open)
- Sound effects and regional music
- Mobile touch controls
- Story archive / lore viewer
- Reward distribution wired to profile system

**Phase 6 — Multiplayer (v2)**
- Party support for story mode co-op
