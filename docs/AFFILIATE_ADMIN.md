# Affiliate Platform & Admin Panel

A full CPA-style affiliate system (think CPALead / MaxBounty) for Credio Pulse:
team members join, generate tracking links, drive traffic & sales, and earn
commission per sale — with robust analytics and multi-layer fraud detection so the
numbers stay legit.

- **Auth:** Better Auth (email + password, roles) — `src/lib/auth.ts`
- **ORM/DB:** Prisma 7 (engine-less, `@prisma/adapter-pg`) → PostgreSQL — `prisma/schema.prisma`, `src/lib/prisma.ts`
- **Tracking:** first-party click tracking + attribution cookies — `src/app/r/[code]/route.ts`
- **Fraud:** scoring engine — `src/lib/fraud/`
- **Conversions:** Stripe webhook → commission — `src/lib/affiliate/conversion.ts`

---

## Routes

| Area | Route | Notes |
| --- | --- | --- |
| Affiliate join | `/join` | Public signup (role defaults to `affiliate`) |
| Login | `/login` | Affiliates + admins |
| Affiliate dashboard | `/dashboard` | Overview, links, clicks, conversions, earnings, payouts |
| Admin panel | `/admin` | Overview, affiliates, conversions, fraud, payouts, settings |
| Referral redirect | `/r/<code>` | Records a click, sets attribution, redirects to the site |
| Auth API | `/api/auth/*` | Better Auth handler |

Roles are stored on the user (`admin` | `affiliate`) and **can only be set
server-side** — an affiliate can never escalate to admin from the client.

---

## First-time setup

1. **Environment** (`.env.local` for the app, `.env` for Prisma CLI — keep
   `DATABASE_URL` in sync):
   ```dotenv
   DATABASE_URL="postgresql://…"          # Neon now; self-hosted Postgres in prod
   BETTER_AUTH_SECRET="…"                  # openssl rand -base64 32
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
   # Optional — enriches clicks with proxy/VPN/datacenter + geo:
   # IPINFO_TOKEN="…"
   ```

2. **Generate client & push schema:**
   ```bash
   pnpm exec prisma generate
   pnpm exec prisma db push
   ```

3. **Create an admin** (sign up at `/join` first, then promote):
   ```bash
   node scripts/make-admin.mjs you@example.com
   ```

4. **(Optional) demo data** to populate the dashboards/charts:
   ```bash
   node scripts/seed-demo.mjs
   ```

Switching to **self-hosted Postgres** later: just change `DATABASE_URL` in both
env files and run `prisma db push` — `@prisma/adapter-pg` speaks standard
Postgres, no code changes.

---

## How attribution works (click → sale → commission)

```
visitor clicks  /r/<code>
   → Click row created (IP hashed, UA parsed, geo, fraud-scored)
   → cookies set: cp_vid (visitor), cp_attr (clickId + affiliateId, signed window)
   → 307 redirect to the landing page

visitor buys on /signup
   → create-subscription reads cp_attr and stamps the Stripe subscription
     metadata with aff_clickId / aff_affiliateId

Stripe `invoice.paid` webhook
   → recordConversion(): re-loads the click (source of truth — a tampered cookie
     can't steal a sale), scores conversion fraud, creates the Conversion and a
     Commission, logs fraud events
```

The **clickId is authoritative**: we always derive the affiliate from the stored
click, not from the cookie's claimed value.

> Conversions require Stripe to be configured (`docs/STRIPE_SETUP.md`). For local
> testing without Stripe, `POST /api/dev/simulate-conversion` (dev-only) creates a
> conversion for the current attribution cookie.

### Commission lifecycle

`APPROVED conversion → Commission PENDING` with `payableAt = now + holdDays`.
After the hold window it becomes **available**; the affiliate requests a payout,
an admin marks it **paid**. Refunds/cancellations (`charge.refunded`,
`customer.subscription.deleted`) reverse the conversion and claw back the
commission automatically.

---

## Fraud detection

Every click and conversion is scored 0–100. Signals (see
`src/lib/fraud/engine.ts`):

**Click signals**
- `NO_UA` / `BOT_UA` / `HEADLESS` — missing, bot, or automation user agents
- `DATACENTER` / `PROXY` / `VPN` — hosting/proxy/VPN IPs (needs `IPINFO_TOKEN`)
- `SELF_CLICK` — a logged-in affiliate clicking their own link
- `DUP_IP` / `DUP_VISITOR` — repeat clicks within 24h (not unique)
- `VELOCITY` — too many clicks from one IP in an hour
- `LONG_FORWARD_CHAIN`, `NO_ACCEPT_LANGUAGE`, `PRIVATE_IP`

Clicks: `< 40` VALID, `40–74` SUSPICIOUS, `≥ 75` INVALID.

**Conversion signals**
- `SELF_PURCHASE` — buyer email = affiliate email
- `NO_ATTRIBUTED_CLICK`, `INVALID_CLICK`, `SUSPICIOUS_CLICK`
- `FAST_CONVERSION` — converted < 15s after the click
- `DUPLICATE_BUYER`, `LOW_TRUST_AFFILIATE`

Conversions at/above **Flag threshold** are held for manual review; at/above
**Reject threshold** they're auto-rejected. Both thresholds, the commission
default, cookie window, hold days, and minimum payout are editable in
**Admin → Settings**. Repeat offenders lose **trust score**, which feeds back into
conversion scoring.

> **IP intelligence:** without `IPINFO_TOKEN` the engine still runs every UA/
> behavioral/velocity/self-click check; proxy/VPN/datacenter detection just needs
> the token. Swap `enrichIp()` in `src/lib/fraud/ip.ts` for MaxMind/IPQualityScore
> in production. Raw IPs are **never stored** — only a salted SHA-256 hash.

### What we capture per click

`IP address, device (mobile/desktop/tablet/bot), browser, OS, country/region/city,
ISP/ASN, referer, landing page, sub-id (?s1=), full user agent`, plus all fraud
signals and the quality verdict.

- **Admins** see the full IP (Admin → Affiliates → click into an affiliate →
  *Recent clicks*).
- **Affiliates** see a masked IP (`203.0.113.x`) on their own Clicks page.
- For dedup we also keep a salted SHA-256 hash of the IP. Raw IPs are PII — handle
  per your privacy policy/retention rules.

---

## Admin capabilities

- **Overview** — platform clicks/conversions/revenue/commission, fraud rate,
  30-day traffic chart, top affiliates, review & payout queues.
- **Affiliates** — approve / suspend / ban, per-affiliate commission overrides,
  promote to admin, drill into per-affiliate stats.
- **Conversions** — review queue; approve (matures the commission) or reject
  (reverses it + dings trust).
- **Fraud** — live feed of every detection signal + top signal counts.
- **Payouts** — approve / mark paid / reject withdrawal requests.
- **Settings** — commission defaults, fraud thresholds, attribution & payout rules.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `node scripts/make-admin.mjs <email>` | Promote a user to admin |
| `node scripts/seed-demo.mjs` | Populate demo clicks/conversions for the first affiliate |
| `node scripts/dbq.mjs "<SQL>"` | Ad-hoc SQL against the DB (dev only) |

---

## Production checklist

- Set the real `DATABASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_BETTER_AUTH_URL`
  (your domain), and a strong `BETTER_AUTH_SECRET`.
- Add `IPINFO_TOKEN` (or wire a different IP-intel provider) for proxy/VPN/DC
  detection.
- Configure Stripe + the webhook (`docs/STRIPE_SETUP.md`) so real purchases create
  conversions.
- Remove the debug checkout logger (see `docs/STRIPE_SETUP.md`).
- Consider rate-limiting `/r/[code]` and `/api/auth/*` at the edge.
