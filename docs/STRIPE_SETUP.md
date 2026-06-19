# Stripe Setup — Credio Pulse

The `/signup` checkout charges real money through **Stripe Subscriptions** using the
embedded **Payment Element**. This guide gets it working in test mode and then live.

> Nothing here works until you complete steps 1–4 and **restart the dev server**.
> Next.js reads environment variables at startup.

---

## How it works (architecture)

| Piece | File |
| --- | --- |
| Server Stripe client | `src/lib/stripe/server.ts` |
| Plan → Price ID map | `src/lib/stripe/prices.ts` |
| Browser Stripe loader | `src/lib/stripe/client.ts` |
| Create subscription (returns client secret) | `src/app/api/stripe/create-subscription/route.ts` |
| Webhook receiver | `src/app/api/stripe/webhook/route.ts` |
| Checkout UI (Payment Element) | `src/components/checkout/CheckoutFlow.tsx` |
| Redirect return page (3DS etc.) | `src/app/signup/success/` |

**Flow:** On step 2 the app calls `create-subscription`, which creates a Customer and an
incomplete Subscription (`payment_behavior: default_incomplete`, `billing_mode: flexible`)
and returns `latest_invoice.confirmation_secret.client_secret`. The Payment Element confirms
that client secret in the browser via `stripe.confirmPayment`. The subscription activates when
the first invoice is paid.

The packages are already installed: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`.

---

## 1. Get your API keys

1. Create/sign in to a Stripe account → **Dashboard**.
2. Keep **Test mode** on (toggle, top-right) while developing.
3. **Developers → API keys**, copy:
   - **Publishable key** → `pk_test_...`
   - **Secret key** → `sk_test_...`

## 2. Create the products and prices

Create **one Product per plan**, each with **two recurring Prices** (monthly + yearly).
The amounts **must match** what the UI shows, or the customer will be charged a different
total than displayed.

| Plan | Monthly price (interval: month) | Yearly price (interval: year) |
| --- | --- | --- |
| Starter | **$1.00** | **$9.60** |
| Secure Basic | **$8.49** | **$81.48** |
| Secure Plus | **$11.49** | **$110.28** |
| Secure Pro | **$21.49** | **$206.28** |

> The yearly amount = the "per-month when billed yearly" figure × 12. These live in
> `src/lib/plans.ts`; if you change prices there, update them in Stripe too.

Fastest path with the Stripe CLI (test mode):

```bash
# Example for Secure Pro — repeat for each plan
stripe products create --name "Secure Pro"
# → returns prod_XXX, then:
stripe prices create --product prod_XXX --currency usd --unit-amount 2149 \
  -d "recurring[interval]=month"
stripe prices create --product prod_XXX --currency usd --unit-amount 20628 \
  -d "recurring[interval]=year"
```

(`unit-amount` is in cents.) Or create them in the Dashboard under **Product catalog**.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...            # from step 5

STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_SECURE_BASIC_MONTHLY=price_...
STRIPE_PRICE_SECURE_BASIC_YEARLY=price_...
STRIPE_PRICE_SECURE_PLUS_MONTHLY=price_...
STRIPE_PRICE_SECURE_PLUS_YEARLY=price_...
STRIPE_PRICE_SECURE_PRO_MONTHLY=price_...
STRIPE_PRICE_SECURE_PRO_YEARLY=price_...
```

`.env.local` is gitignored — never commit real keys.

## 4. Restart the dev server

```bash
pnpm dev
```

Open `/signup`. Step 2 should now show the Stripe Payment Element instead of the
"Payments aren't configured" notice.

## 5. Set up the webhook (recommended)

Webhooks are the reliable source of truth for activating/cancelling access (the browser can
close before client-side confirmation finishes). The receiver lives at
`/api/stripe/webhook` and currently verifies the signature and acknowledges events —
add your provisioning logic in the `TODO` branches once a database exists.

**Local development** (Stripe CLI):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET, then restart `pnpm dev`
```

**Production:** Dashboard → **Developers → Webhooks → Add endpoint**
`https://crediopulse.com/api/stripe/webhook`, subscribe to at least:
`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`,
`customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

## 6. Test the flow

Use Stripe test cards (any future expiry, any CVC, any ZIP):

| Card | Behavior |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds immediately |
| `4000 0025 0000 3155` | Requires 3D Secure (redirects to `/signup/success`) |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Insufficient funds |

A successful payment lands on the in-page confirmation; redirect-based cards return to
`/signup/success`. Verify the Subscription + first invoice in the Stripe Dashboard.

## 7. Going live

1. Flip the Dashboard to **Live mode** and create live products/prices.
2. Swap `.env` (or your host's env vars) to `pk_live_...` / `sk_live_...` and live `price_...` IDs.
3. Add the **live** webhook endpoint and its `whsec_...`.
4. Set all env vars in your hosting provider (e.g. Vercel project settings), then redeploy.

---

## Notes & gotchas

- **PCI:** card data is entered in Stripe's iframe (Payment Element) and never touches our
  servers — only the identity fields (SSN/DOB/phone) and the email/name do.
- **Billing-cycle toggle:** changing monthly/yearly on step 2 creates a fresh incomplete
  subscription. Stripe auto-expires unpaid incomplete subscriptions (~23h), so this is safe,
  but you can add cleanup later if desired.
- **Amounts must match `src/lib/plans.ts`.** The charged amount comes from the Stripe Price,
  not the UI. Keep them in sync.
- **Remove the debug logger before production:** `src/app/api/debug-checkout/route.ts`, the two
  `logCheckout(...)` calls in `CheckoutFlow.tsx`, and the `checkout-debug.log` line in
  `.gitignore`. It writes SSN/PII to a plaintext file.
- **Account creation is not wired yet.** Checkout charges the card, but the user account
  (Better Auth) and the link between the Stripe customer and your user record still need to be
  built — that's the next backend milestone.
