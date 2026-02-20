"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { PartyQueuePayload } from "@/lib/supabase/party-realtime";

export interface PartyMember {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
}

interface PartyContextValue {
  members: PartyMember[];
  partyLeaderId: string | null;
  isLeader: boolean;
  partyQueuePayload: PartyQueuePayload | null;
  setPartyQueuePayload: (p: PartyQueuePayload | null) => void;
  addMember: (m: PartyMember) => void;
  removeMember: (id: string) => void;
  clearParty: () => void;
  setPartyLeader: (leaderId: string | null) => void;
  canQueue1v1: boolean;
  canQueue3v3: boolean;
  canPlayRanked: boolean;
  /** True when user can queue casual (leader, or solo with no party) */
  canPlayCasual: boolean;
}

const MAX_PARTY_SIZE = 6;

const PartyContext = createContext<PartyContextValue | null>(null);

export function PartyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [partyLeaderId, setPartyLeaderId] = useState<string | null>(null);
  const [partyQueuePayload, setPartyQueuePayload] = useState<PartyQueuePayload | null>(null);

  const addMember = useCallback((m: PartyMember) => {
    setMembers((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      if (prev.length >= MAX_PARTY_SIZE) return prev;
      return [...prev, m];
    });
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearParty = useCallback(() => {
    setMembers([]);
    setPartyLeaderId(null);
    setPartyQueuePayload(null);
  }, []);

  const setPartyLeader = useCallback((leaderId: string | null) => {
    setPartyLeaderId(leaderId);
  }, []);

  const isLeader = !partyLeaderId || partyLeaderId === user?.id;
  const canQueue1v1 = members.length <= 2 && isLeader;
  const canQueue3v3 = isLeader;
  const canPlayRanked = members.length === 0;
  const canPlayCasual = isLeader || members.length === 0;

  return (
    <PartyContext.Provider
      value={{
        members,
        partyLeaderId,
        isLeader,
        partyQueuePayload,
        setPartyQueuePayload,
        addMember,
        removeMember,
        clearParty,
        setPartyLeader,
        canQueue1v1,
        canQueue3v3,
        canPlayRanked,
        canPlayCasual,
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
