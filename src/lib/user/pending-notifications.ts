/** Pending notifications (rank-up, level-up dismissed without claiming) */
export type PendingNotificationType = "rank_up" | "level_up";

export interface PendingNotification {
  id: string;
  type: PendingNotificationType;
  tier?: string;
  level?: number;
  createdAt: string;
}

const STORAGE_KEY = "ll_pending_notifications";

export function getPendingNotifications(): PendingNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPendingNotification(
  type: PendingNotificationType,
  data?: { tier?: string; level?: number }
): void {
  const list = getPendingNotifications();
  const id = `${type}_${Date.now()}`;
  list.unshift({
    id,
    type,
    tier: data?.tier,
    level: data?.level,
    createdAt: new Date().toISOString(),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
    window.dispatchEvent(new CustomEvent("ll-pending-notifications"));
  }
}

export function removePendingNotification(id: string): void {
  const list = getPendingNotifications().filter((n) => n.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("ll-pending-notifications"));
  }
}

export function clearPendingNotifications(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
