# Ranked Mode: Level/Difficulty Implementation Options

## Current Behavior
- Ranked uses the full VOCAB_QUESTIONS pool (all grades mixed)
- Subject: vocabulary for Bronze/Silver, vocabulary + punctuation for Gold+
- Bots scale in difficulty by rank (higher rank = harder bots)

## Options for Implementing Levels in Ranked

### Option A: Rank-Based Question Difficulty (Recommended)
**How it works:** Your rank determines which grade pool you get. Bronze/Silver get easier vocab, higher ranks get harder.

| Rank     | Vocab Pool      |
|----------|-----------------|
| Bronze   | Grade 3–5       |
| Silver   | Grade 4–6       |
| Gold     | Grade 5–7       |
| Platinum | Grade 6–8       |
| Diamond  | Grade 7–8       |
| Emerald  | Grade 8 only    |

**Pros:** Fair progression, players grow with the game  
**Cons:** New players might find Bronze too easy

### Option B: Same Questions for Everyone
**How it works:** Everyone gets the same mixed pool (current behavior).

**Pros:** Truly fair—same challenge for all  
**Cons:** Can feel too hard for new players, too easy for advanced

### Option C: Player-Selected Difficulty (Matchmaking)
**How it works:** Players pick a tier (e.g. "Grade 5–6") before searching. Matchmaking pairs same-tier players.

**Pros:** Player choice, balanced matches  
**Cons:** Splits player base, longer queue times

### Option D: Adaptive / Performance-Based
**How it works:** Track player accuracy per grade. Serve questions from grades where they're ~70% accurate to keep challenge balanced.

**Pros:** Personalized, always appropriately challenging  
**Cons:** More complex, needs per-player stats

---

## Recommendation
**Option A** is the best balance: simple to implement (reuse `getVocabQuestionsByGrade` with rank→grade mapping), feels progressive, and doesn’t split matchmaking.

Implementation: In ranked page, map `profile.rank_tier` to a grade or grade range, then pass `vocabGrade` (or a `vocabGradeMin`/`vocabGradeMax`) to `getQuestionsForMode` when fetching questions for the match.
