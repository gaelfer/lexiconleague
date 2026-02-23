# Party & Friend System Redesign

## Design Goals (from interview)
- Fix party dissolution (parties don't clean up when leader leaves)
- Room code join flow + friend invite (both)
- Floating minimizable party widget (replaces bottom PartyBar)
- Persistent DB-backed parties (survive page refresh)
- Supabase Realtime for party events; polling for friend requests
- Friend profiles/stats + recent players list
- Classmates and friends are separate systems

---

## Database Schema (full redesign)

### Drop
- `public.friends` — replaced by a DB view over `friend_requests`
- `public.party_invitations` — recreated with `party_id` FK

### Keep (untouched)
- `public.friend_requests` — source of truth for friendship state

### New tables

#### `parties`
```sql
CREATE TABLE public.parties (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,           -- 6-char room code e.g. "XK742B"
  leader_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'open'
             CHECK (status IN ('open', 'dissolved')),
  created_at timestamptz DEFAULT now()
);
```

#### `party_members`
```sql
CREATE TABLE public.party_members (
  party_id  uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (party_id, user_id)
);
-- A user can only be in one party at a time
CREATE UNIQUE INDEX party_members_user_unique ON public.party_members(user_id);
```

#### `party_invitations` (redesigned)
```sql
CREATE TABLE public.party_invitations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(party_id, invitee_id),
  CHECK (inviter_id != invitee_id)
);
```

#### `recent_players`
```sql
CREATE TABLE public.recent_players (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_with_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_played_at timestamptz DEFAULT now() NOT NULL,
  games_played   integer DEFAULT 1 NOT NULL,
  PRIMARY KEY (user_id, played_with_id)
);
```

#### `friends` view (replaces table)
```sql
CREATE VIEW public.friends_view AS
  SELECT from_user_id AS user_id, to_user_id AS friend_id
  FROM public.friend_requests WHERE status = 'accepted'
  UNION ALL
  SELECT to_user_id AS user_id, from_user_id AS friend_id
  FROM public.friend_requests WHERE status = 'accepted';
```
This eliminates the dual-write bug (inserting 2 rows when accepting a request). The view auto-stays in sync.

### DB Trigger: dissolve party when leader leaves
```sql
CREATE OR REPLACE FUNCTION public.handle_party_leader_leave()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parties
  SET status = 'dissolved'
  WHERE id = OLD.party_id
    AND leader_id = OLD.user_id
    AND status = 'open';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_party_leader_leave
AFTER DELETE ON public.party_members
FOR EACH ROW EXECUTE FUNCTION public.handle_party_leader_leave();
```
When the leader's `party_members` row is deleted, the party status flips to `dissolved` atomically. All members receive the Realtime event and clear their local state.

---

## Party Lifecycle

```
create party → insert parties row (with room code) + party_members row for leader
join by code → find open party by code → insert party_members row (if < 6 members)
join by invite → accept party_invitation → insert party_members row
leave (member) → delete own party_members row
leave (leader) → delete own party_members row → DB trigger dissolves party
                 → all members receive Realtime UPDATE on parties (status=dissolved)
                 → clients clear party state
page close (leader) → beforeunload fires → navigator.sendBeacon('/api/party/dissolve')
                     → server-side deletes leader's party_members row → same trigger flow
```

---

## File Plan

### New files
| File | Purpose |
|---|---|
| `supabase/migrations/20260224_party_friend_redesign.sql` | Full schema migration |
| `src/lib/supabase/parties.ts` | createParty, joinByCode, leaveParty, inviteFriend, acceptInvite, declineInvite, getPartyWithMembers |
| `src/lib/supabase/recent-players.ts` | recordMatch (upsert), getRecentPlayers |
| `src/components/PartyWidget.tsx` | Floating minimizable party widget |
| `src/components/FriendProfileModal.tsx` | Friend stats modal (level, rank, win rate, streak) |
| `src/app/api/party/dissolve/route.ts` | POST endpoint called by navigator.sendBeacon on beforeunload |

### Rewrites
| File | What changes |
|---|---|
| `src/lib/supabase/friends.ts` | Query `friend_requests` (not friends table) for friend list; preserve existing API surface |
| `src/context/PartyContext.tsx` | DB-backed; fetches party on mount; subscribes to Realtime on `party_members` + `parties`; beforeunload cleanup |
| `src/context/NotificationContext.tsx` | Party invitations switch from polling to Supabase Realtime subscription; friend request polling stays |
| `src/app/friends/page.tsx` | Add Recent Players section; add friend profile click → FriendProfileModal; clean up layout |
| `src/app/layout.tsx` | Swap `<PartyBar />` + `<PartyRealtimeSync />` for `<PartyWidget />` |

### Deletions
| File | Why |
|---|---|
| `src/lib/supabase/party-invitations.ts` | Replaced by parties.ts |
| `src/lib/supabase/party-realtime.ts` | Replaced by PartyContext Realtime subscriptions |
| `src/components/PartyBar.tsx` | Replaced by PartyWidget |
| `src/components/PartyRealtimeSync.tsx` | Merged into PartyContext |

### Minimal updates
| File | What changes |
|---|---|
| `src/app/play/casual/page.tsx` | Use `party.id` for broadcast channel (not leaderId); call recordMatch for all participants after game ends |
| `src/components/NotificationBell.tsx` | Handle new party_invitation schema (has party_id now) |

---

## PartyContext Realtime Architecture

```typescript
// On mount: fetch current party for user (SELECT from party_members + parties)
// If in a party, subscribe to two Realtime channels:

supabase
  .channel(`party-state:${partyId}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'party_members',
    filter: `party_id=eq.${partyId}`
  }, handleMemberChange)           // INSERT = add member, DELETE = remove member
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'parties',
    filter: `id=eq.${partyId}`
  }, handlePartyUpdate)            // status = 'dissolved' → clearParty()
  .subscribe();
```

The broadcast channel (`party:{leaderId}`) for game queue start moves to `party:{partyId}` — same mechanism, just keyed by partyId instead of leaderId.

---

## PartyWidget UI

**Collapsed** (default when user is in party after the initial expand):
- Fixed bottom-right: small pill showing 2-3 overlapping avatars + "party (N)" label
- Click anywhere on pill to expand

**Expanded**:
- Card panel, bottom-right, ~280px wide
- Header: "Party (N/6)" + minimize button (▼)
- Room code: `XK742B` with copy-to-clipboard icon
- Member list: avatar + username, with (×) remove button for leader
- If leader: "+ Invite Friend" button (opens inline search) + "Queue" link
- If member: "Leader queues for you" note
- "Leave Party" button (red, bottom)

**State transitions**:
- No party → widget hidden
- First join/create → widget auto-expands
- Subsequent visits → starts collapsed

---

## Friends Page Redesign

Layout (3 sections):

1. **Add Friend** — search input with autocomplete, send request button

2. **Pending** — collapsible, shows incoming requests (accept/decline) and outgoing (cancel)

3. **Friends** — list with:
   - Avatar, username, level chip, rank badge
   - "Invite" button → creates or adds to existing party
   - Click row → opens FriendProfileModal

4. **Recent Players** (new) — last 10 unique players met in matches
   - Avatar, username
   - "Add Friend" button (if not already friends)
   - "Invite" button

## FriendProfileModal

- Avatar (full size)
- Username, level, rank tier
- Stats pulled from profiles table: total XP, win streak, vocab grade
- "Invite to Party" button
- "Remove Friend" button

---

## Notification Changes

**Switch to Realtime:**
```typescript
// In NotificationContext, on mount:
supabase
  .channel('incoming-party-invites')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public',
    table: 'party_invitations',
    filter: `invitee_id=eq.${userId}`
  }, (payload) => {
    // Immediately add to partyInvitations state — no polling lag
  })
  .subscribe();
```

**Keep polling for:**
- Incoming friend requests (45s, respects visibility — keep as-is)
- Accepted friend request notifications (45s — keep as-is)

---

## Implementation Order

1. **Migration** — new DB schema, trigger, RLS policies
2. **Data layer** — `parties.ts`, `recent-players.ts`, rewrite `friends.ts`
3. **PartyContext rewrite** — DB-backed, Realtime subs, beforeunload handler
4. **API route** — `/api/party/dissolve` for beacon cleanup
5. **NotificationContext update** — swap party invite polling for Realtime
6. **PartyWidget** — new floating widget
7. **FriendProfileModal** — new component
8. **Friends page redesign** — recent players, profile modal integration
9. **Layout swap** — PartyBar/PartyRealtimeSync → PartyWidget
10. **Casual play updates** — partyId channel, recordMatch call
11. **NotificationBell update** — new invite schema
12. **Deletions** — remove old files
