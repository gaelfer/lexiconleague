"use client";

import { useAuth } from "@/context/AuthContext";
import { getTeacherPortalStatus, isTeacherPortalEnabled } from "@/lib/supabase/teacher-portal";
import { TeacherPortalStatus } from "@/types";
import { useEffect, useState } from "react";

export interface TeacherPortalAccessState {
  checking: boolean;
  portalEnabled: boolean;
  isAuthenticated: boolean;
  status: TeacherPortalStatus | null;
  error: string | null;
}

const INITIAL_STATE: TeacherPortalAccessState = {
  checking: true,
  portalEnabled: false,
  isAuthenticated: false,
  status: null,
  error: null,
};

export function useTeacherPortalAccess(): TeacherPortalAccessState {
  const { user, loading } = useAuth();
  const [state, setState] = useState<TeacherPortalAccessState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    if (loading) {
      setState((prev) => ({ ...prev, checking: true }));
      return;
    }

    if (!user) {
      setState({
        checking: false,
        portalEnabled: false,
        isAuthenticated: false,
        status: null,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, checking: true, isAuthenticated: true }));

    (async () => {
      const [enabled, portalStatus] = await Promise.all([
        isTeacherPortalEnabled(),
        getTeacherPortalStatus(),
      ]);

      if (cancelled) return;

      setState({
        checking: false,
        portalEnabled: enabled,
        isAuthenticated: true,
        status: portalStatus.status ?? null,
        error: portalStatus.success ? null : (portalStatus.error ?? "Could not load teacher status"),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return state;
}
