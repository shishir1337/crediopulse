import { type NextRequest, NextResponse } from "next/server";
import {
  ATTR_COOKIE,
  type Attribution,
  encodeAttribution,
  VID_COOKIE,
} from "@/lib/affiliate/attribution";
import { originFromHeaders } from "@/lib/base-url";
import { getSettings } from "@/lib/affiliate/settings";
import { auth } from "@/lib/auth";
import { type ClickContext, scoreClick } from "@/lib/fraud/engine";
import {
  clientIpFromHeaders,
  enrichIp,
  forwardedChainLength,
  geoFromHeaders,
  hashIp,
  isPrivateIp,
} from "@/lib/fraud/ip";
import { parseUserAgent } from "@/lib/fraud/userAgent";
import { generateVisitorId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;

// Where an affiliate's default link sends visitors (campaign links can override
// this with their own `destination`).
const DEFAULT_LANDING = "/signup?plan=starter&cycle=monthly";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  // Use the proxy-forwarded host so redirects keep the real public domain
  // (crediopulse.com) instead of the internal localhost:3000 Next.js sees.
  const origin = originFromHeaders(request.headers) ?? request.nextUrl.origin;

  // Resolve the code: an AffiliateLink, or an affiliate's default refCode.
  const link = await prisma.affiliateLink.findUnique({
    where: { code },
    include: { affiliate: { include: { user: true } } },
  });
  const affiliate =
    link?.affiliate ??
    (await prisma.affiliate.findUnique({
      where: { refCode: code },
      include: { user: true },
    }));

  const destination = link?.destination ?? DEFAULT_LANDING;
  const redirectUrl = new URL(destination, origin);

  // Unknown code or inactive/banned affiliate → pass through, no tracking.
  if (
    !affiliate ||
    affiliate.status === "BANNED" ||
    affiliate.status === "SUSPENDED" ||
    (link && !link.isActive)
  ) {
    return NextResponse.redirect(redirectUrl);
  }

  const headers = request.headers;
  const ua = headers.get("user-agent");
  const acceptLanguage = headers.get("accept-language");
  const referer = headers.get("referer");
  const subId = request.nextUrl.searchParams.get("s1");

  const ip = clientIpFromHeaders(headers);
  const ipHash = hashIp(ip);
  const parsed = parseUserAgent(ua);
  const intel = await enrichIp(ip);
  const geo = geoFromHeaders(headers);

  // Self-click: is the visitor the affiliate themselves (logged in)?
  let affiliateIsViewer = false;
  try {
    const session = await auth.api.getSession({ headers });
    if (session?.user?.id === affiliate.userId) affiliateIsViewer = true;
  } catch {
    // ignore session errors
  }

  // Dedup + velocity (24h uniqueness window, 1h velocity window)
  const since24h = new Date(Date.now() - DAY);
  const since1h = new Date(Date.now() - DAY / 24);
  const visitorId =
    request.cookies.get(VID_COOKIE)?.value ?? generateVisitorId();

  const [dupVisitor, dupIp, recentIpClicks] = await Promise.all([
    prisma.click.count({
      where: {
        affiliateId: affiliate.id,
        visitorId,
        createdAt: { gte: since24h },
      },
    }),
    ipHash
      ? prisma.click.count({
          where: {
            affiliateId: affiliate.id,
            ipHash,
            createdAt: { gte: since24h },
          },
        })
      : Promise.resolve(0),
    ipHash
      ? prisma.click.count({
          where: {
            affiliateId: affiliate.id,
            ipHash,
            createdAt: { gte: since1h },
          },
        })
      : Promise.resolve(0),
  ]);

  const ctx: ClickContext = {
    hasUserAgent: Boolean(ua && ua.trim().length >= 8),
    isBotUa: parsed.isBot,
    isHeadless: parsed.isHeadless,
    isProxy: intel.isProxy,
    isVpn: intel.isVpn,
    isHosting: intel.isHosting,
    isPrivateIp: isPrivateIp(ip),
    longForwardChain: forwardedChainLength(headers) > 2,
    affiliateIsViewer,
    duplicateIp: dupIp > 0,
    duplicateVisitor: dupVisitor > 0,
    recentIpClicks,
    noAcceptLanguage: !acceptLanguage,
  };
  const result = scoreClick(ctx);

  const click = await prisma.click.create({
    data: {
      affiliateId: affiliate.id,
      linkId: link?.id ?? null,
      visitorId,
      ip,
      ipHash,
      country: intel.country ?? geo.country ?? null,
      region: intel.region ?? geo.region ?? null,
      city: intel.city ?? geo.city ?? null,
      asn: intel.asn ?? null,
      isp: intel.isp ?? null,
      userAgent: ua?.slice(0, 500) ?? null,
      browser: parsed.browser,
      os: parsed.os,
      device: parsed.device,
      referer: referer?.slice(0, 500) ?? null,
      landing: destination,
      subId: subId?.slice(0, 120) ?? null,
      fraudScore: result.score,
      status: result.status,
      isUnique: result.isUnique,
      isBot: result.isBot,
      isProxy: result.isProxy,
      isVpn: result.isVpn,
      isDatacenter: result.isDatacenter,
      flags: result.flags,
    },
  });

  if (result.flags.length > 0) {
    await prisma.fraudEvent.create({
      data: {
        affiliateId: affiliate.id,
        clickId: click.id,
        scope: "CLICK",
        type: result.flags[0],
        severity: result.score,
        detail: result.flags.join(", "),
        meta: { flags: result.flags, status: result.status },
      },
    });
  }

  // Set attribution + visitor cookies, then redirect to the landing page.
  const settings = await getSettings();
  const attr: Attribution = {
    c: click.id,
    a: affiliate.id,
    l: link?.id,
    v: visitorId,
    t: Date.now(),
  };
  const response = NextResponse.redirect(redirectUrl);
  const secure = process.env.NODE_ENV === "production";
  const baseCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
  response.cookies.set(VID_COOKIE, visitorId, {
    ...baseCookie,
    maxAge: 365 * 24 * 60 * 60,
  });
  response.cookies.set(ATTR_COOKIE, encodeAttribution(attr), {
    ...baseCookie,
    maxAge: settings.cookieWindowDays * 24 * 60 * 60,
  });
  return response;
}
