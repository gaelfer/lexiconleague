/** Dismissed "accepted friend request" notification IDs (persisted) */
const STORAGE_KEY = "ll_dismissed_friend_accept";

export function getDismissedAcceptedFriendRequestIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function dismissAcceptedFriendRequest(id: string): void {
  const set = getDismissedAcceptedFriendRequestIds();
  set.add(id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-100)));
    window.dispatchEvent(new CustomEvent("ll-dismissed-friend-accept"));
  }
}

/** Dismissed "accepted party invite" notification IDs (persisted) */
const PARTY_ACCEPT_STORAGE_KEY = "ll_dismissed_party_accept";

export function getDismissedAcceptedPartyInviteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PARTY_ACCEPT_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function dismissAcceptedPartyInvite(id: string): void {
  const set = getDismissedAcceptedPartyInviteIds();
  set.add(id);
  if (typeof window !== "undefined") {
    localStorage.setItem(PARTY_ACCEPT_STORAGE_KEY, JSON.stringify([...set].slice(-100)));
    window.dispatchEvent(new CustomEvent("ll-dismissed-party-accept"));
  }
}
