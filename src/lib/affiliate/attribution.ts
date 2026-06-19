// First-party attribution cookie. Carries the click that referred a visitor so a
// later purchase can be credited to the right affiliate. The clickId is the source
// of truth — at conversion time we re-load the click and trust *its* affiliateId,
// so a tampered cookie can't steal another affiliate's sale.

export const VID_COOKIE = "cp_vid";
export const ATTR_COOKIE = "cp_attr";

export type Attribution = {
  /** clickId */
  c: string;
  /** affiliateId (convenience; verified against the click) */
  a: string;
  /** linkId */
  l?: string;
  /** visitorId */
  v: string;
  /** issued-at (epoch ms) */
  t: number;
};

export function encodeAttribution(attr: Attribution): string {
  return Buffer.from(JSON.stringify(attr), "utf8").toString("base64url");
}

export function decodeAttribution(
  value: string | undefined | null,
): Attribution | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Attribution;
    if (
      parsed &&
      typeof parsed.c === "string" &&
      typeof parsed.a === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
