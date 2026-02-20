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

  // Pull from Supabase when tab visible: immediate sync + 45s interval when focused
  useEffect(() => {
    if (!user) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const sync = () => syncProfileForUser(user.id, user.email ?? "").catch(() => {});
    const startPolling = () => {
      if (document.visibilityState !== "visible") return;
      sync();
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        sync();
      }, 45_000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };
    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopPolling();
    };
  }, [user]);

  // Push local writes (purchases, rewards, etc.) shortly after they happen
  useEffect(() => {
    if (!user) return;
    const onLocalProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: "local" | "remote" }>;
      if (customEvent.detail?.source !== "local") return;
      if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
      pushDebounceRef.current = setTimeout(async () => {
        try {
          await syncCurrentProfile(user.id);
        } catch (e) {
          console.warn("[ProfileSyncOnLoad] Push failed, retrying in 2s:", e);
          setTimeout(() => {
            syncCurrentProfile(user.id).catch((e2) => {
              console.error("[ProfileSyncOnLoad] Retry also failed:", e2);
            });
          }, 2000);
        }
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
