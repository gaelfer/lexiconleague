"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getIncomingFriendRequests,
  getAcceptedFriendRequestsAsSender,
  FriendRequestEntry,
  AcceptedFriendRequestEntry,
} from "@/lib/supabase/friends";
import {
  getIncomingPartyInvites,
  PartyInvitationEntry,
} from "@/lib/supabase/parties";
import { createClient } from "@/lib/supabase/client";
import { getDismissedAcceptedFriendRequestIds } from "@/lib/user/dismissed-notifications";

export interface NotificationState {
  friendRequests: FriendRequestEntry[];
  acceptedFriendRequests: AcceptedFriendRequestEntry[];
  partyInvitations: PartyInvitationEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationState | null>(null);
const POLL_INTERVAL_MS = 45_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequestEntry[]>([]);
  const [acceptedFriendRequests, setAcceptedFriendRequests] = useState<AcceptedFriendRequestEntry[]>([]);
  const [partyInvitations, setPartyInvitations] = useState<PartyInvitationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeChannelRef = useRef<any>(null);

  // ── Polling: friend requests (45 s, visibility-aware) ────
  const refresh = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      setAcceptedFriendRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [reqs, accepted] = await Promise.all([
      getIncomingFriendRequests(user.id),
      getAcceptedFriendRequestsAsSender(user.id),
    ]);

    setFriendRequests(reqs);
    const dismissed = getDismissedAcceptedFriendRequestIds();
    setAcceptedFriendRequests(accepted.filter((a) => !dismissed.has(a.id)));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
    };
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("ll-dismissed-friend-accept", handler);
    return () => window.removeEventListener("ll-dismissed-friend-accept", handler);
  }, [refresh]);

  // ── Realtime: party invitations ───────────────────────────
  useEffect(() => {
    if (!user) {
      setPartyInvitations([]);
      return;
    }

    // Initial load of pending party invitations
    getIncomingPartyInvites(user.id).then(setPartyInvitations);

    const supabase = createClient();

    const channel = supabase
      .channel(`party-invites:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_invitations",
          filter: `invitee_id=eq.${user.id}`,
        },
        async () => {
          // Re-fetch to get full profile info with the new invite
          const invites = await getIncomingPartyInvites(user.id);
          setPartyInvitations(invites);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "party_invitations",
          filter: `invitee_id=eq.${user.id}`,
        },
        async () => {
          // Accepted/declined — refresh to remove the handled invite
          const invites = await getIncomingPartyInvites(user.id);
          setPartyInvitations(invites);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel as unknown as typeof realtimeChannelRef.current;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [user?.id]);

  const value = useMemo<NotificationState>(
    () => ({
      friendRequests,
      acceptedFriendRequests,
      partyInvitations,
      loading,
      refresh,
    }),
    [friendRequests, acceptedFriendRequests, partyInvitations, loading, refresh]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return (
    ctx ?? {
      friendRequests: [],
      acceptedFriendRequests: [],
      partyInvitations: [],
      loading: false,
      refresh: async () => {},
    }
  );
}
