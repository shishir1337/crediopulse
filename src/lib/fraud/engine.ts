// Fraud scoring engine. Pure functions: the route gathers signals (IP intel,
// dedup/velocity from the DB, self-click) and this combines them into a 0–100
// risk score + flags. Modeled on how CPA networks grade clicks/leads.

export type ClickStatus = "VALID" | "SUSPICIOUS" | "INVALID";

export type ClickContext = {
  hasUserAgent: boolean;
  isBotUa: boolean;
  isHeadless: boolean;
  isProxy: boolean;
  isVpn: boolean;
  isHosting: boolean;
  isPrivateIp: boolean;
  longForwardChain: boolean;
  /** A logged-in affiliate clicking their own link (self-click). */
  affiliateIsViewer: boolean;
  duplicateIp: boolean;
  duplicateVisitor: boolean;
  /** Clicks from this IP for this affiliate in the last hour. */
  recentIpClicks: number;
  /** Visitor's Accept-Language is missing — common for bots/scripts. */
  noAcceptLanguage: boolean;
};

const CLICK_WEIGHTS = {
  NO_UA: 55,
  BOT_UA: 60,
  HEADLESS: 70,
  DATACENTER: 45,
  PROXY: 35,
  VPN: 30,
  SELF_CLICK: 90,
  DUP_IP: 22,
  DUP_VISITOR: 30,
  VELOCITY: 40,
  PRIVATE_IP: 12,
  LONG_CHAIN: 15,
  NO_LANG: 12,
} as const;

export type ClickScore = {
  score: number;
  status: ClickStatus;
  isUnique: boolean;
  isBot: boolean;
  isProxy: boolean;
  isVpn: boolean;
  isDatacenter: boolean;
  flags: string[];
};

export function scoreClick(ctx: ClickContext): ClickScore {
  const flags: string[] = [];
  let score = 0;
  const add = (flag: string, weight: number) => {
    flags.push(flag);
    score += weight;
  };

  if (!ctx.hasUserAgent) add("NO_UA", CLICK_WEIGHTS.NO_UA);
  else if (ctx.isHeadless) add("HEADLESS", CLICK_WEIGHTS.HEADLESS);
  else if (ctx.isBotUa) add("BOT_UA", CLICK_WEIGHTS.BOT_UA);

  if (ctx.isHosting) add("DATACENTER", CLICK_WEIGHTS.DATACENTER);
  if (ctx.isProxy) add("PROXY", CLICK_WEIGHTS.PROXY);
  if (ctx.isVpn) add("VPN", CLICK_WEIGHTS.VPN);

  if (ctx.affiliateIsViewer) add("SELF_CLICK", CLICK_WEIGHTS.SELF_CLICK);

  if (ctx.duplicateVisitor) add("DUP_VISITOR", CLICK_WEIGHTS.DUP_VISITOR);
  else if (ctx.duplicateIp) add("DUP_IP", CLICK_WEIGHTS.DUP_IP);

  if (ctx.recentIpClicks >= 10) add("VELOCITY", CLICK_WEIGHTS.VELOCITY);
  if (ctx.isPrivateIp) add("PRIVATE_IP", CLICK_WEIGHTS.PRIVATE_IP);
  if (ctx.longForwardChain) add("LONG_FORWARD_CHAIN", CLICK_WEIGHTS.LONG_CHAIN);
  if (ctx.noAcceptLanguage) add("NO_ACCEPT_LANGUAGE", CLICK_WEIGHTS.NO_LANG);

  score = Math.min(100, score);
  const status: ClickStatus =
    score >= 75 ? "INVALID" : score >= 40 ? "SUSPICIOUS" : "VALID";

  return {
    score,
    status,
    isUnique: !ctx.duplicateIp && !ctx.duplicateVisitor,
    isBot: ctx.isBotUa || ctx.isHeadless || !ctx.hasUserAgent,
    isProxy: ctx.isProxy,
    isVpn: ctx.isVpn,
    isDatacenter: ctx.isHosting,
    flags,
  };
}

export type ConversionContext = {
  hasClick: boolean;
  clickStatus?: ClickStatus;
  secondsSinceClick?: number | null;
  /** Buyer email matches the affiliate's own email. */
  selfPurchase: boolean;
  /** This buyer IP/customer already converted recently. */
  duplicateBuyer: boolean;
  affiliateTrustScore: number;
};

const CONV_WEIGHTS = {
  NO_CLICK: 30,
  INVALID_CLICK: 55,
  SUSPICIOUS_CLICK: 28,
  FAST_CONVERSION: 35,
  SELF_PURCHASE: 95,
  DUPLICATE_BUYER: 45,
  LOW_TRUST: 20,
} as const;

export type ConversionScore = { score: number; flags: string[] };

export function scoreConversion(ctx: ConversionContext): ConversionScore {
  const flags: string[] = [];
  let score = 0;
  const add = (flag: string, weight: number) => {
    flags.push(flag);
    score += weight;
  };

  if (!ctx.hasClick) {
    add("NO_ATTRIBUTED_CLICK", CONV_WEIGHTS.NO_CLICK);
  } else {
    if (ctx.clickStatus === "INVALID")
      add("INVALID_CLICK", CONV_WEIGHTS.INVALID_CLICK);
    else if (ctx.clickStatus === "SUSPICIOUS")
      add("SUSPICIOUS_CLICK", CONV_WEIGHTS.SUSPICIOUS_CLICK);
    if (ctx.secondsSinceClick != null && ctx.secondsSinceClick < 15)
      add("FAST_CONVERSION", CONV_WEIGHTS.FAST_CONVERSION);
  }

  if (ctx.selfPurchase) add("SELF_PURCHASE", CONV_WEIGHTS.SELF_PURCHASE);
  if (ctx.duplicateBuyer) add("DUPLICATE_BUYER", CONV_WEIGHTS.DUPLICATE_BUYER);
  if (ctx.affiliateTrustScore < 50)
    add("LOW_TRUST_AFFILIATE", CONV_WEIGHTS.LOW_TRUST);

  return { score: Math.min(100, score), flags };
}

/** Maps a conversion fraud score to a status using configurable thresholds. */
export function conversionStatusFor(
  score: number,
  flagThreshold: number,
  rejectThreshold: number,
): "APPROVED" | "FLAGGED" | "REJECTED" {
  if (score >= rejectThreshold) return "REJECTED";
  if (score >= flagThreshold) return "FLAGGED";
  return "APPROVED";
}

/** Human-readable labels for the dashboards. */
export const FRAUD_LABELS: Record<string, string> = {
  NO_UA: "Missing user agent",
  BOT_UA: "Bot user agent",
  HEADLESS: "Headless browser",
  DATACENTER: "Datacenter IP",
  PROXY: "Proxy / Tor",
  VPN: "VPN",
  SELF_CLICK: "Self-click (affiliate)",
  DUP_IP: "Duplicate IP",
  DUP_VISITOR: "Duplicate visitor",
  VELOCITY: "Click velocity",
  PRIVATE_IP: "Private IP",
  LONG_FORWARD_CHAIN: "Long proxy chain",
  NO_ACCEPT_LANGUAGE: "No Accept-Language",
  NO_ATTRIBUTED_CLICK: "No attributed click",
  INVALID_CLICK: "Invalid source click",
  SUSPICIOUS_CLICK: "Suspicious source click",
  FAST_CONVERSION: "Converted too fast",
  SELF_PURCHASE: "Self-purchase",
  DUPLICATE_BUYER: "Duplicate buyer",
  LOW_TRUST_AFFILIATE: "Low-trust affiliate",
};
