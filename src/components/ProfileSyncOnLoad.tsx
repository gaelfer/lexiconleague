"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncProfileForUser } from "@/lib/user/profile-sync";

/**
 * Syncs local profile to Supabase when the app loads and user is authenticated.
 * Ensures local progress (trophies, xp, etc.) is pushed to the database so
 * leaderboard and other users see up-to-date data.
 */
export default function ProfileSyncOnLoad() {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (syncedRef.current) return;
    syncedRef.current = true;
    syncProfileForUser(user.id, user.email ?? "").catch(() => {
      syncedRef.current = false;
    });
  }, [user, loading]);

  return null;
}
