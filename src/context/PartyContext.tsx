"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface PartyMember {
  id: string;
  username: string;
  avatar_config: Record<string, unknown>;
}

interface PartyContextValue {
  members: PartyMember[];
  addMember: (m: PartyMember) => void;
  removeMember: (id: string) => void;
  clearParty: () => void;
  canQueue1v1: boolean;
  canQueue3v3: boolean;
  canPlayRanked: boolean;
}

const MAX_PARTY_SIZE = 6;

const PartyContext = createContext<PartyContextValue | null>(null);

export function PartyProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<PartyMember[]>([]);

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

  const clearParty = useCallback(() => setMembers([]), []);

  const canQueue1v1 = members.length <= 2;
  const canQueue3v3 = members.length <= 6;
  const canPlayRanked = members.length === 0;

  return (
    <PartyContext.Provider
      value={{
        members,
        addMember,
        removeMember,
        clearParty,
        canQueue1v1,
        canQueue3v3,
        canPlayRanked,
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
