"use client";

import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG } from "@/types";
import { createClient } from "./client";

export async function fetchAvatarConfig(
  userId: string
): Promise<InkAvatarConfig> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_config")
    .eq("id", userId)
    .single();

  if (error || !data?.avatar_config) {
    return { ...DEFAULT_AVATAR_CONFIG };
  }

  return { ...DEFAULT_AVATAR_CONFIG, ...data.avatar_config };
}

export async function updateAvatarConfig(
  userId: string,
  config: InkAvatarConfig
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_config: config })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
