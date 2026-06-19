import crypto from "node:crypto";

const SALT =
  process.env.IP_HASH_SALT ??
  process.env.BETTER_AUTH_SECRET ??
  "cp-fallback-salt";

/** We never persist raw IPs — only a salted hash, for dedup + privacy. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(`${ip}|${SALT}`).digest("hex");
}

export function clientIpFromHeaders(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return (
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    h.get("x-vercel-forwarded-for") ??
    null
  );
}

export function isPrivateIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  return (
    /^(10\.|127\.|192\.168\.|169\.254\.|::1$|fc00:|fe80:|0\.0\.0\.0)/.test(
      ip,
    ) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/** How many distinct IPs appear in the forwarding chain — long chains hint at proxying. */
export function forwardedChainLength(h: Headers): number {
  const xff = h.get("x-forwarded-for");
  if (!xff) return 0;
  return xff.split(",").filter((s) => s.trim().length > 0).length;
}

export type IpIntel = {
  country?: string;
  region?: string;
  city?: string;
  asn?: string;
  isp?: string;
  isProxy: boolean;
  isVpn: boolean;
  isHosting: boolean;
};

const EMPTY_INTEL: IpIntel = { isProxy: false, isVpn: false, isHosting: false };

/**
 * Optional IP enrichment via IPInfo (set IPINFO_TOKEN). Returns proxy/VPN/hosting
 * privacy flags + geo. Without a token, returns empty intel and the engine relies
 * on its header/UA/behavioral heuristics instead. Swap for MaxMind/IPQS in prod.
 */
export async function enrichIp(ip: string | null): Promise<IpIntel> {
  const token = process.env.IPINFO_TOKEN;
  if (!ip || isPrivateIp(ip) || !token) return EMPTY_INTEL;
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return EMPTY_INTEL;
    const d = (await res.json()) as {
      country?: string;
      region?: string;
      city?: string;
      org?: string;
      privacy?: {
        proxy?: boolean;
        vpn?: boolean;
        hosting?: boolean;
        tor?: boolean;
      };
    };
    const p = d.privacy ?? {};
    return {
      country: d.country,
      region: d.region,
      city: d.city,
      asn: d.org,
      isp: d.org,
      isProxy: Boolean(p.proxy || p.tor),
      isVpn: Boolean(p.vpn),
      isHosting: Boolean(p.hosting),
    };
  } catch {
    return EMPTY_INTEL;
  }
}

/** Geo headers injected by some hosts (Vercel/Cloudflare) when no IP intel token is set. */
export function geoFromHeaders(h: Headers): {
  country?: string;
  region?: string;
  city?: string;
} {
  return {
    country: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? undefined,
    region: h.get("x-vercel-ip-country-region") ?? undefined,
    city: h.get("x-vercel-ip-city") ?? undefined,
  };
}
