// Idempotent Stripe product/price bootstrapper for Credio Pulse.
//
// Reads STRIPE_SECRET_KEY from .env.local, then creates (or reuses) one Product
// per plan and two recurring Prices each (monthly + yearly). Amounts are derived
// from src/lib/plans.ts so Stripe always matches the UI. Finally it writes the
// resulting price IDs back into .env.local.
//
// Usage:
//   1. Put your test secret key in .env.local:  STRIPE_SECRET_KEY=sk_test_...
//   2. node scripts/stripe-setup.mjs
//
// Safe to run repeatedly: prices are keyed by `lookup_key`, so re-runs reuse the
// existing price instead of creating duplicates. Run it again in live mode (with
// an sk_live_ key) to provision live prices.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import Stripe from "stripe";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");

dotenv.config({ path: ENV_PATH });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error(
    "\n✗ STRIPE_SECRET_KEY is not set in .env.local.\n" +
      "  Add your test key first, e.g.:\n" +
      "    STRIPE_SECRET_KEY=sk_test_...\n" +
      "  then re-run: node scripts/stripe-setup.mjs\n",
  );
  process.exit(1);
}
const mode = secretKey.startsWith("sk_live_") ? "LIVE" : "TEST";

// Pull the plans straight from the app's source of truth.
const plansUrl = pathToFileURL(resolve(ROOT, "src/lib/plans.ts")).href;
let PLANS;
let totalDue;
try {
  ({ PLANS, totalDue } = await import(plansUrl));
} catch {
  // plans.ts is TS; if the runtime can't import it directly, fall back to a
  // tiny inline mirror (kept in sync manually). This keeps the script working
  // on Node versions without TS stripping.
  PLANS = null;
}

// Env var suffix per plan id.
const ENV_KEY = {
  starter: "STARTER",
  "secure-basic": "SECURE_BASIC",
  "secure-plus": "SECURE_PLUS",
  "secure-pro": "SECURE_PRO",
  "secure-max": "SECURE_MAX",
};

// Fallback mirror of plans (only used if the TS import above fails).
const FALLBACK_PLANS = [
  { id: "starter", name: "Starter", monthly: 1, yearly: 0.8 },
  { id: "secure-basic", name: "Secure Basic", monthly: 8.49, yearly: 6.79 },
  { id: "secure-plus", name: "Secure Plus", monthly: 11.49, yearly: 9.19 },
  { id: "secure-pro", name: "Secure Pro", monthly: 21.49, yearly: 17.19 },
];
if (!PLANS) PLANS = FALLBACK_PLANS;
const yearlyTotal = (p) =>
  typeof totalDue === "function"
    ? totalDue(p, "yearly")
    : Number((p.yearly * 12).toFixed(2));

const stripe = new Stripe(secretKey);
const cents = (dollars) => Math.round(dollars * 100);

async function findOrCreateProduct(plan) {
  const lookup = `cp_${plan.id}`;
  // Search by our own metadata tag so re-runs reuse the same product.
  const found = await stripe.products.search({
    query: `metadata['cp_plan']:'${plan.id}'`,
  });
  if (found.data[0]) return found.data[0];
  return stripe.products.create({
    name: `Credio Pulse — ${plan.name}`,
    metadata: { cp_plan: plan.id, cp_lookup: lookup },
  });
}

async function findOrCreatePrice(product, plan, cycle) {
  const interval = cycle === "yearly" ? "year" : "month";
  const amount =
    cycle === "yearly" ? cents(yearlyTotal(plan)) : cents(plan.monthly);
  const lookupKey = `cp_${plan.id}_${cycle}`;

  const existing = await stripe.prices.list({ lookup_keys: [lookupKey] });
  const match = existing.data.find(
    (p) =>
      p.active &&
      p.unit_amount === amount &&
      p.currency === "usd" &&
      p.recurring?.interval === interval,
  );
  if (match) return { price: match, reused: true };

  // Deactivate a stale price holding this lookup key (e.g. amount changed), then
  // create a fresh one and transfer the key over.
  for (const p of existing.data) {
    if (p.active) await stripe.prices.update(p.id, { active: false });
  }
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: amount,
    recurring: { interval },
    lookup_key: lookupKey,
    transfer_lookup_key: true,
  });
  return { price, reused: false };
}

function updateEnvFile(vars) {
  let text = readFileSync(ENV_PATH, "utf8");
  for (const [key, value] of Object.entries(vars)) {
    const line = `${key}=${value}`;
    // Replace an existing (commented or live) line, else append.
    const re = new RegExp(`^#?\\s*${key}=.*$`, "m");
    if (re.test(text)) {
      text = text.replace(re, line);
    } else {
      text = `${text.replace(/\s*$/, "")}\n${line}\n`;
    }
  }
  writeFileSync(ENV_PATH, text);
}

console.log(`\nProvisioning Stripe products/prices in ${mode} mode…\n`);

const envVars = {};
for (const plan of PLANS) {
  const suffix = ENV_KEY[plan.id];
  if (!suffix) {
    console.warn(`  ! No env key mapping for plan "${plan.id}" — skipping`);
    continue;
  }
  const product = await findOrCreateProduct(plan);
  for (const cycle of ["monthly", "yearly"]) {
    const { price, reused } = await findOrCreatePrice(product, plan, cycle);
    const varName = `STRIPE_PRICE_${suffix}_${cycle.toUpperCase()}`;
    envVars[varName] = price.id;
    const dollars = (price.unit_amount / 100).toFixed(2);
    console.log(
      `  ${reused ? "↺ reused" : "✓ created"}  ${plan.name} ${cycle.padEnd(7)} $${dollars}  ${price.id}`,
    );
  }
}

updateEnvFile(envVars);

console.log(`\n✓ Wrote ${Object.keys(envVars).length} price IDs to .env.local`);
console.log("\nNext:");
console.log("  1. Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is also set.");
console.log("  2. Restart the dev server (env is read at startup).");
console.log("  3. Set up the webhook (see docs/STRIPE_SETUP.md §5).\n");
