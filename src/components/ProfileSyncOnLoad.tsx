"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncProfileForUser } from "@/lib/user/profile-sync";

/**
 * Syncs local profile to Supabase when the app loads and when the tab becomes
 * visible. Ensures local progress (trophies, xp, etc.) is pushed to the database.
 */
export default function ProfileSyncOnLoad() {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);

  // Initial sync on load
  useEffect(() => {
    if (loading || !user) return;
    if (syncedRef.current) return;
    syncedRef.current = true;
    syncProfileForUser(user.id, user.email ?? "").catch(() => {
      syncedRef.current = false;
    });
  }, [user, loading]);

  // Pull latest profile from Supabase when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!user) return;
      syncProfileForUser(user.id, user.email ?? "").catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user]);

  return null;
}
