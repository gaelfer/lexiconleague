"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  Party,
  PartyMember,
  PartyQueuePayload,
  getCurrentParty,
  createParty,
  joinPartyByCode,
  leaveParty,
  kickMember,
  subscribeToPartyQueue,
} from "@/lib/supabase/parties";

// Re-export so pages importing PartyMember from @/context/PartyContext still work
export type { PartyMember, PartyQueuePayload } from "@/lib/supabase/parties";

interface PartyContextValue {
  // State
  party: Party | null;
  partyQueuePayload: PartyQueuePayload | null;
  setPartyQueuePayload: (p: PartyQueuePayload | null) => void;

  // Derived
  partyId: string | null;
  partyLeaderId: string | null;
  members: PartyMember[];
  isLeader: boolean;
  canQueue1v1: boolean;
  canQueue3v3: boolean;
  canPlayRanked: boolean;
  canPlayCasual: boolean;

  // Actions
  startParty: () => Promise<{ error?: string }>;
  joinByCode: (code: string) => Promise<{ error?: string }>;
  clearParty: () => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Legacy setters kept for pages that still use them
  /** @deprecated Use startParty() */
  setPartyLeader: (leaderId: string | null) => void;
  /** @deprecated Party members now sync automatically via Realtime */
  addMember: (m: PartyMember) => void;
}

const PartyContext = createContext<PartyContextValue | null>(null);

export function PartyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [partyQueuePayload, setPartyQueuePayload] = useState<PartyQueuePayload | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeChannelRef = useRef<any>(null);
  const queueUnsubRef = useRef<(() => void) | null>(null);

  // ── Initial load ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setParty(null);
      return;
    }
    getCurrentParty(user.id).then((p) => setParty(p));
  }, [user?.id]);

  // ── Realtime: subscribe to party_members + parties changes ─
  useEffect(() => {
    if (!user || !party?.id) {
      if (realtimeChannelRef.current) {
        createClient().removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    const supabase = createClient();
    const partyId = party.id;

    const channel = supabase
      .channel(`party-state:${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "party_members",
          filter: `party_id=eq.${partyId}`,
        },
        async (_payload: unknown) => {
          // Re-fetch the full party when membership changes
          const updated = await getCurrentParty(user.id);
          if (updated) {
            setParty(updated);
          } else {
            // Current user was kicked or party dissolved
            setParty(null);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "parties",
          filter: `id=eq.${partyId}`,
        },
        (payload: { new: { status?: string } }) => {
          const newRecord = payload.new as { status?: string };
          if (newRecord?.status === "dissolved") {
            setParty(null);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel as unknown as typeof realtimeChannelRef.current;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [user?.id, party?.id]);

  // ── Realtime: subscribe to queue broadcast when member ────
  useEffect(() => {
    if (!user || !party?.id || party.leader_id === user.id) {
      queueUnsubRef.current?.();
      queueUnsubRef.current = null;
      return;
    }

    const unsub = subscribeToPartyQueue(party.id, (payload) => {
      setPartyQueuePayload(payload);
      // Navigation is handled in PartyWidget / casual page
      if (typeof window !== "undefined") {
        window.location.href = "/play/casual";
      }
    });

    queueUnsubRef.current = unsub;
    return () => {
      unsub();
      queueUnsubRef.current = null;
    };
  }, [user?.id, party?.id, party?.leader_id]);

  // ── beforeunload: dissolve party if leader closes browser ──
  useEffect(() => {
    if (!user || !party?.id || party.leader_id !== user.id) return;

    const partyId = party.id;

    const handleBeforeUnload = () => {
      const url = "/api/party/dissolve";
      try {
        navigator.sendBeacon(url, JSON.stringify({ partyId, userId: user.id }));
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.id, party?.id, party?.leader_id]);

  // ── Actions ───────────────────────────────────────────────
  const startParty = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: "Not signed in" };
    const profile: PartyMember = {
      id: user.id,
      username: (user as { user_metadata?: { username?: string } }).user_metadata?.username ?? "Challenger",
      avatar_config: {},
    };
    const { party: newParty, error } = await createParty(user.id, profile);
    if (error) return { error };
    setParty(newParty ?? null);
    return {};
  }, [user]);

  const joinByCode = useCallback(
    async (code: string): Promise<{ error?: string }> => {
      if (!user) return { error: "Not signed in" };
      const profile: PartyMember = {
        id: user.id,
        username:
          (user as { user_metadata?: { username?: string } }).user_metadata?.username ?? "Challenger",
        avatar_config: {},
      };
      const { party: joined, error } = await joinPartyByCode(user.id, code, profile);
      if (error) return { error };
      setParty(joined ?? null);
      return {};
    },
    [user]
  );

  const clearParty = useCallback(async (): Promise<void> => {
    if (!user) return;
    await leaveParty(user.id);
    setParty(null);
  }, [user?.id]);

  const removeMember = useCallback(
    async (memberId: string): Promise<void> => {
      if (!user || !party) return;
      await kickMember(party.id, user.id, memberId);
      // State updates via Realtime
    },
    [user?.id, party?.id]
  );

  // ── Legacy stubs (kept to avoid breaking pages using old API) ──
  const setPartyLeader = useCallback(
    (leaderId: string | null) => {
      if (!leaderId || !user) return;
      // In the new system, joining a party via invite automatically syncs via Realtime.
      // This stub prevents compile errors in pages not yet migrated.
      void leaderId;
    },
    [user?.id]
  );

  const addMember = useCallback(
    (m: PartyMember) => {
      // Party membership now comes from DB — no-op here.
      void m;
    },
    []
  );

  // ── Derived values ────────────────────────────────────────
  const partyId = party?.id ?? null;
  const partyLeaderId = party?.leader_id ?? null;
  const members = party?.members ?? [];
  const isLeader = !partyLeaderId || partyLeaderId === user?.id;
  const canQueue1v1 = members.length <= 2 && isLeader;
  const canQueue3v3 = isLeader;
  const canPlayRanked = members.length === 0;
  const canPlayCasual = isLeader || members.length === 0;

  return (
    <PartyContext.Provider
      value={{
        party,
        partyQueuePayload,
        setPartyQueuePayload,
        partyId,
        partyLeaderId,
        members,
        isLeader,
        canQueue1v1,
        canQueue3v3,
        canPlayRanked,
        canPlayCasual,
        startParty,
        joinByCode,
        clearParty,
        removeMember,
        setPartyLeader,
        addMember,
      }}
    >
      {children}
    </PartyContext.Provider>
  );
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used within PartyProvider");
  return ctx;
}
