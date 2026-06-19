// Lightweight User-Agent classification + bot/automation detection.
// No external dependency — pattern matching tuned for affiliate-fraud signals.

const BOT_RE =
  /(bot|crawler|spider|crawl|slurp|mediapartners|facebookexternalhit|embedly|quora|pinterest|vkshare|w3c_validator|headless|phantomjs|puppeteer|playwright|selenium|chrome-lighthouse|curl|wget|python-requests|python|go-http|java\/|okhttp|libwww|scrapy|httpclient|axios|node-fetch|got\/|http_request|dataprovider|semrush|ahrefs|mj12|dotbot|petalbot|bytespider)/i;

const HEADLESS_RE = /(headless|puppeteer|playwright|selenium|phantomjs)/i;

export type ParsedUa = {
  browser: string;
  os: string;
  device: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  isBot: boolean;
  isHeadless: boolean;
};

export function parseUserAgent(ua: string | null | undefined): ParsedUa {
  if (!ua || ua.trim().length < 8) {
    return {
      browser: "unknown",
      os: "unknown",
      device: "unknown",
      isBot: true,
      isHeadless: false,
    };
  }

  const isHeadless = HEADLESS_RE.test(ua);
  const isBot = isHeadless || BOT_RE.test(ua);

  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);
  const isMobile =
    /mobile|android|iphone|ipod|windows phone/i.test(ua) && !isTablet;
  const device: ParsedUa["device"] = isBot
    ? "bot"
    : isTablet
      ? "tablet"
      : isMobile
        ? "mobile"
        : "desktop";

  let browser = "Other";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os|macintosh/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod| ios/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, device, isBot, isHeadless };
}
