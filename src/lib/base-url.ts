import { headers } from "next/headers";

/** Configured public origin (used as a fallback / in non-request contexts). */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

/**
 * Derives the public origin from a request's headers, honoring the reverse
 * proxy's `x-forwarded-host` / `x-forwarded-proto`. Returns null when no host
 * header is present. Use this anywhere you have a `Headers` object (route
 * handlers, middleware) so redirects don't leak the internal `localhost:3000`
 * the proxy forwards to.
 */
export function originFromHeaders(h: Headers): string | null {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

/**
 * The origin the app is actually served from (from the request headers). This
 * keeps referral links correct no matter what port/host the app runs on in dev,
 * and uses the real domain in production.
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const origin = originFromHeaders(await headers());
    if (origin) return origin;
  } catch {
    // not in a request scope
  }
  return getSiteUrl();
}

export async function refLink(code: string): Promise<string> {
  return `${await getRequestOrigin()}/r/${code}`;
}
