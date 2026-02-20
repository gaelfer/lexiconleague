# Investigation Report: RAM, Real-time Sync & Trophy Storage

## 1. Where Trophies Are Stored

| Location | Key/Table | Format |
|----------|-----------|--------|
| **Primary (local)** | `localStorage` → `ll_profile` | JSON `UserProfile` with `trophies: number` |
| **Secondary (remote)** | Supabase `public.profiles` | Column `trophies` (integer) |

**Flow:**
1. Game ends → `applyGameResult()` in `src/lib/user/storage.ts` updates `profile.trophies` and calls `saveProfile()`
2. `saveProfile()` writes to `localStorage` and dispatches `ll-profile-updated`
3. `syncCurrentProfile()` (or debounced listener) pushes to Supabase via `upsertProfile()` in `src/lib/supabase/profile.ts`
4. Supabase stores in `profiles.trophies`; DB trigger keeps `rank_tier` in sync with trophies

---

## 2. Why "Real-time" Changes Aren't Happening

**The app does NOT use Supabase Realtime** for the `profiles` table. It uses:

- **Push**: Event-driven. When you buy, play, or claim → `saveProfile()` → `syncCurrentProfile()` → `upsertProfile()` (REST API).
- **Pull**: Polling every 45s (after optimization) **only when the tab is visible**.

So:
- **App → Supabase**: Changes are pushed immediately after each action (with 600ms debounce for rapid updates).
- **Supabase → App**: Changes (e.g. edits in Table Editor) are pulled on visibility change and every 45s while the tab is focused.

**If changes still don't appear in Supabase:**
1. **Auth session**: `upsertProfile` checks `getSession()`; if missing/expired, it returns an error.
2. **RLS**: Policies require `auth.uid() = id`. If the session is wrong, writes are blocked.
3. **Console**: Check for `[ProfileSync] Failed to push profile` or `Not authenticated` in the browser console.

---

## 3. RAM Usage & Optimizations Applied

**Likely causes of high RAM:**
- **Overlapping polling**: Profile sync (20s) + notifications (20s) both ran every 20s, even when the tab was hidden.
- **Background work**: Intervals kept running when the user switched tabs, causing unnecessary fetches and object churn.
- **Supabase Realtime channels**: Matchmaking and party channels stay open during play; they are cleaned up on unmount.

**Changes made:**
1. **ProfileSyncOnLoad**: Poll only when the tab is visible. When hidden, the interval is cleared. Interval increased from 20s to 45s.
2. **NotificationContext**: Poll interval increased from 20s to 45s.

---

## 4. Project Structure (Relevant Paths)

```
src/
├── lib/
│   ├── user/
│   │   ├── storage.ts      # localStorage get/save, applyGameResult, trophies
│   │   └── profile-sync.ts # syncCurrentProfile, syncProfileForUser
│   └── supabase/
│       └── profile.ts      # fetchProfile, upsertProfile → Supabase
├── components/
│   └── ProfileSyncOnLoad.tsx  # Initial sync, visibility pull, debounced push
└── app/
    └── play/ranked/page.tsx   # handleComplete → syncCurrentProfile after game
```

---

## 5. Enabling True Supabase Realtime (Optional)

To get live updates when `profiles` changes in Supabase (e.g. from Table Editor):

```ts
// Example: subscribe to profiles changes for current user
const channel = supabase
  .channel('profile-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${userId}`,
  }, (payload) => {
    // Merge payload.new into local profile, saveProfile, emit event
  })
  .subscribe();
```

You must enable Realtime for the `profiles` table in Supabase Dashboard → Database → Replication.
