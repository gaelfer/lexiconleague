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
import { useParty } from "@/context/PartyContext";
import {
  getIncomingFriendRequests,
  getAcceptedFriendRequestsAsSender,
  FriendRequestEntry,
  AcceptedFriendRequestEntry,
} from "@/lib/supabase/friends";
import {
  getIncomingPartyInvitations,
  getAcceptedPartyInvitesAsInviter,
  PartyInvitationEntry,
} from "@/lib/supabase/party-invitations";
import { getDismissedAcceptedFriendRequestIds, getDismissedAcceptedPartyInviteIds } from "@/lib/user/dismissed-notifications";

export interface AcceptedPartyInviteEntry {
  id: string;
  invitee_id: string;
  invitee_username?: string;
  invitee_avatar_config?: Record<string, unknown>;
}

export interface NotificationState {
  friendRequests: FriendRequestEntry[];
  acceptedFriendRequests: AcceptedFriendRequestEntry[];
  acceptedPartyInvites: AcceptedPartyInviteEntry[];
  partyInvitations: PartyInvitationEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationState | null>(null);
const POLL_INTERVAL_MS = 45_000;
const PROCESSED_PARTY_INVITES_KEY = "ll_processed_party_accept_invites";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addMember, setPartyLeader } = useParty();
  const [friendRequests, setFriendRequests] = useState<FriendRequestEntry[]>([]);
  const [acceptedFriendRequests, setAcceptedFriendRequests] = useState<AcceptedFriendRequestEntry[]>([]);
  const [acceptedPartyInvites, setAcceptedPartyInvites] = useState<AcceptedPartyInviteEntry[]>([]);
  const [partyInvitations, setPartyInvitations] = useState<PartyInvitationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const processedInviteIds = useRef<Set<string>>(new Set());

  // Persist processed accepted-party-invite IDs so old accepted invites don't
  // auto-recreate a party after reload/leave.
  useEffect(() => {
    if (!user || typeof window === "undefined") {
      processedInviteIds.current = new Set();
      return;
    }
    try {
      const raw = localStorage.getItem(`${PROCESSED_PARTY_INVITES_KEY}:${user.id}`);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      processedInviteIds.current = new Set(Array.isArray(arr) ? arr : []);
    } catch {
      processedInviteIds.current = new Set();
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      setAcceptedFriendRequests([]);
      setAcceptedPartyInvites([]);
      setPartyInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [reqs, accepted, invs, acceptedAsInviter] = await Promise.all([
      getIncomingFriendRequests(user.id),
      getAcceptedFriendRequestsAsSender(user.id),
      getIncomingPartyInvitations(user.id),
      getAcceptedPartyInvitesAsInviter(user.id),
    ]);
    setFriendRequests(reqs);
    const dismissed = getDismissedAcceptedFriendRequestIds();
    setAcceptedFriendRequests(accepted.filter((a) => !dismissed.has(a.id)));
    const partyDismissed = getDismissedAcceptedPartyInviteIds();
    setAcceptedPartyInvites(
      acceptedAsInviter.map((a) => ({
        id: a.id,
        invitee_id: a.invitee_id,
        invitee_username: a.invitee_username,
        invitee_avatar_config: a.invitee_avatar_config,
      })).filter((a) => !partyDismissed.has(a.id))
    );
    setPartyInvitations(invs);

    let processedChanged = false;
    for (const inv of acceptedAsInviter) {
      if (partyDismissed.has(inv.id)) continue;
      if (processedInviteIds.current.has(inv.id)) continue;
      processedInviteIds.current.add(inv.id);
      processedChanged = true;
      setPartyLeader(user.id); // Inviter is the party leader
      addMember({
        id: inv.invitee_id,
        username: inv.invitee_username ?? "Challenger",
        avatar_config: inv.invitee_avatar_config ?? {},
      });
    }
    if (processedChanged && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${PROCESSED_PARTY_INVITES_KEY}:${user.id}`,
          JSON.stringify([...processedInviteIds.current].slice(-200))
        );
      } catch {}
    }
    setLoading(false);
  }, [user?.id, addMember, setPartyLeader]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("ll-dismissed-friend-accept", handler);
    window.addEventListener("ll-dismissed-party-accept", handler);
    return () => {
      window.removeEventListener("ll-dismissed-friend-accept", handler);
      window.removeEventListener("ll-dismissed-party-accept", handler);
    };
  }, [refresh]);

  const value = useMemo<NotificationState>(
    () => ({
      friendRequests,
      acceptedFriendRequests,
      acceptedPartyInvites,
      partyInvitations,
      loading,
      refresh,
    }),
    [friendRequests, acceptedFriendRequests, acceptedPartyInvites, partyInvitations, loading, refresh]
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
      acceptedPartyInvites: [],
      partyInvitations: [],
      loading: false,
      refresh: async () => {},
    }
  );
}
