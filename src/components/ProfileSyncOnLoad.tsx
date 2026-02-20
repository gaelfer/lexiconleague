"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncCurrentProfile, syncProfileForUser } from "@/lib/user/profile-sync";

const POLL_MS = 60_000;

/**
 * Central sync hub: pulls from Supabase on load + tab focus,
 * pushes local changes when ll-profile-updated fires.
 * No other component should register its own visibility/sync listeners.
 */
export default function ProfileSyncOnLoad() {
  const { user, loading } = useAuth();
  const syncedRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (syncedRef.current) return;
    syncedRef.current = true;
    syncProfileForUser(user.id, user.email ?? "").catch(() => {
      syncedRef.current = false;
    });
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const pull = () => syncProfileForUser(user.id, user.email ?? "").catch(() => {});

    const startPolling = () => {
      if (document.visibilityState !== "visible") return;
      pull();
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") pull();
      }, POLL_MS);
    };

    const stopPolling = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const onVisibility = () => {
      document.visibilityState === "visible" ? startPolling() : stopPolling();
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<{ source?: string }>).detail;
      if (detail?.source !== "local") return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        syncCurrentProfile(user.id).catch(() => {
          setTimeout(() => syncCurrentProfile(user.id).catch(() => {}), 3000);
        });
      }, 800);
    };
    window.addEventListener("ll-profile-updated", onLocal);
    return () => {
      window.removeEventListener("ll-profile-updated", onLocal);
      if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
    };
  }, [user]);

  return null;
}
