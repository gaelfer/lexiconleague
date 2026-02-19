"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useParty } from "@/context/PartyContext";
import { subscribeToPartyQueue } from "@/lib/supabase/party-realtime";

/** Subscribes to party leader's channel when user is a party member. On queue broadcast, navigates to casual with payload. */
export default function PartyRealtimeSync() {
  const { user } = useAuth();
  const { partyLeaderId, setPartyQueuePayload } = useParty();
  const router = useRouter();

  useEffect(() => {
    if (!user || !partyLeaderId || partyLeaderId === user.id) return;
    const unsubscribe = subscribeToPartyQueue(partyLeaderId, (payload) => {
      setPartyQueuePayload(payload);
      router.push("/play/casual");
    });
    return unsubscribe;
  }, [user?.id, partyLeaderId, setPartyQueuePayload, router]);

  return null;
}
