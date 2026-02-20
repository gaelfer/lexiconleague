"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncCurrentProfile, syncProfileForUser } from "@/lib/user/profile-sync";

/**
 * Syncs local profile to Supabase when the app loads and when the tab becomes
 * visible. Ensures local progress (trophies, xp, etc.) is pushed to the database.
 */
export default function ProfileSyncOnLoad() {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);
  const pushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Keep local profile in sync with cloud edits (e.g. manual Supabase table updates)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      syncProfileForUser(user.id, user.email ?? "").catch(() => {});
    }, 20_000);
    return () => clearInterval(interval);
  }, [user]);

  // Push local writes (purchases, rewards, etc.) shortly after they happen
  useEffect(() => {
    if (!user) return;
    const onLocalProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: "local" | "remote" }>;
      if (customEvent.detail?.source !== "local") return;
      if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
      pushDebounceRef.current = setTimeout(() => {
        syncCurrentProfile(user.id).catch(() => {});
      }, 600);
    };
    window.addEventListener("ll-profile-updated", onLocalProfileUpdated);
    return () => {
      window.removeEventListener("ll-profile-updated", onLocalProfileUpdated);
      if (pushDebounceRef.current) {
        clearTimeout(pushDebounceRef.current);
        pushDebounceRef.current = null;
      }
    };
  }, [user]);

  return null;
}
