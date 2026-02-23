"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile } from "@/lib/supabase/profile";

/** Redirects to /onboarding when user is logged in but hasn't completed onboarding. */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setChecked(true);
      return;
    }
    if (
      pathname?.startsWith("/auth/") ||
      pathname === "/onboarding" ||
      pathname?.startsWith("/teacher")
    ) {
      setChecked(true);
      return;
    }
    fetchProfile(user.id).then((profile) => {
      if (profile?.account_type === "teacher") {
        setChecked(true);
        return;
      }
      if (profile && profile.onboarding_completed === false) {
        router.replace(`/onboarding?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }
      setChecked(true);
    });
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
