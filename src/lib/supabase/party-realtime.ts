"use client";

import { createClient } from "./client";
import type { OpponentInfo } from "@/lib/game/matchmaking";
import type { InkAvatarConfig, VocabLevel } from "@/types";

export interface PartyQueuePayload {
  mode: "1v1" | "3v3";
  subject: "vocabulary" | "punctuation";
  vocabGrade?: VocabLevel;
  seed: string;
  startedAt: number;
  opponents: OpponentInfo[];
  teamMembers: { username: string; avatar_config: InkAvatarConfig; isBot?: boolean }[];
  botResults: {
    opponents: { correct: number; total: number }[];
    teammates: { correct: number; total: number }[];
  };
}

const PARTY_QUEUE_EVENT = "party_queue_start";

export function getPartyChannelName(leaderId: string): string {
  return `party:${leaderId}`;
}

export async function broadcastPartyQueue(
  leaderId: string,
  payload: PartyQueuePayload
): Promise<boolean> {
  const supabase = createClient();
  const channel = supabase.channel(getPartyChannelName(leaderId));
  return new Promise<boolean>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: PARTY_QUEUE_EVENT,
          payload,
        });
        setTimeout(() => {
          supabase.removeChannel(channel);
          resolve(true);
        }, 500);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        supabase.removeChannel(channel);
        resolve(false);
      }
    });
  });
}

export function subscribeToPartyQueue(
  leaderId: string,
  onPayload: (payload: PartyQueuePayload) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(getPartyChannelName(leaderId));
  channel.on("broadcast", { event: PARTY_QUEUE_EVENT }, ({ payload }) => {
    onPayload(payload as PartyQueuePayload);
  });
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
