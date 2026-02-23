"use client";

import { usePathname } from "next/navigation";
import { useParty } from "@/context/PartyContext";
import PartyWidget from "./PartyWidget";

/** Path prefixes where the widget should never show. */
const NEVER_SHOW_PREFIXES = [
  "/auth",
  "/teacher",
  "/ranked",
  "/play/ranked",
  "/onboarding",
];

export default function PartyWidgetWrapper() {
  const pathname = usePathname();
  const { members } = useParty();

  if (!pathname) return null;

  // Never show on landing page
  if (pathname === "/") return null;

  // Never show on auth, teacher, ranked, onboarding
  if (NEVER_SHOW_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  // Show overlay whenever user is in a party (including solo — just created)
  if (members.length >= 1) {
    return <PartyWidget />;
  }

  // When not in party: dashboard renders PartyWidget inline; no overlay
  return null;
}
