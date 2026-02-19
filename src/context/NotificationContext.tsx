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
import { useParty } from "@/context/PartyContext";
import { getIncomingFriendRequests, FriendRequestEntry } from "@/lib/supabase/friends";
import {
  getIncomingPartyInvitations,
  getAcceptedPartyInvitesAsInviter,
  PartyInvitationEntry,
} from "@/lib/supabase/party-invitations";

export interface NotificationState {
  friendRequests: FriendRequestEntry[];
  partyInvitations: PartyInvitationEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationState | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addMember } = useParty();
  const [friendRequests, setFriendRequests] = useState<FriendRequestEntry[]>([]);
  const [partyInvitations, setPartyInvitations] = useState<PartyInvitationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const processedInviteIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      setPartyInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [reqs, invs, acceptedAsInviter] = await Promise.all([
      getIncomingFriendRequests(user.id),
      getIncomingPartyInvitations(user.id),
      getAcceptedPartyInvitesAsInviter(user.id),
    ]);
    setFriendRequests(reqs);
    setPartyInvitations(invs);

    for (const inv of acceptedAsInviter) {
      if (processedInviteIds.current.has(inv.id)) continue;
      processedInviteIds.current.add(inv.id);
      addMember({
        id: inv.invitee_id,
        username: inv.invitee_username ?? "Challenger",
        avatar_config: inv.invitee_avatar_config ?? {},
      });
    }
    setLoading(false);
  }, [user?.id, addMember]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const value: NotificationState = {
    friendRequests,
    partyInvitations,
    loading,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return ctx ?? { friendRequests: [], partyInvitations: [], loading: false, refresh: async () => {} };
}
