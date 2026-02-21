/**
 * Base URL for auth redirects. Must match Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://lexiconleague.vercel.app) so you only need one entry in Supabase.
 */
export function getAuthRedirectBase(): string {
  if (typeof window !== "undefined") {
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site) {
      return site.endsWith("/") ? site.slice(0, -1) : site;
    }
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
