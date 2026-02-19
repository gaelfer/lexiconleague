"use client";

import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";

/** Notification bell in header area — visible site-wide when logged in */
export default function GlobalNotificationBar() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="shrink-0">
      <NotificationBell />
    </div>
  );
}
