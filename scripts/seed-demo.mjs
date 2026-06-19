// Populate demo analytics for the first affiliate so dashboards look alive.
//   node scripts/seed-demo.mjs
// Idempotent: clears that affiliate's clicks/conversions/commissions first.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const env = fs.readFileSync(path.join(root, ".env"), "utf8");
const url = env.match(/DATABASE_URL="([^"]+)"/)[1];
const db = new pg.Client({ connectionString: url });
await db.connect();

const id = () => crypto.randomUUID();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const DAY = 86_400_000;

const aff = (
  await db.query(`SELECT id FROM "Affiliate" ORDER BY "createdAt" ASC LIMIT 1`)
).rows[0];
if (!aff) {
  console.error("No affiliate found. Sign up at /join first.");
  process.exit(1);
}
const affiliateId = aff.id;

await db.query(
  `UPDATE "Affiliate" SET status='ACTIVE', "trustScore"=84 WHERE id=$1`,
  [affiliateId],
);
// clear previous demo rows
await db.query(`DELETE FROM "Commission" WHERE "affiliateId"=$1`, [
  affiliateId,
]);
await db.query(`DELETE FROM "Conversion" WHERE "affiliateId"=$1`, [
  affiliateId,
]);
await db.query(`DELETE FROM "Click" WHERE "affiliateId"=$1`, [affiliateId]);
await db.query(`DELETE FROM "FraudEvent" WHERE "affiliateId"=$1`, [
  affiliateId,
]);

const countries = ["US", "US", "US", "CA", "GB", "US", "DE"];
const devices = ["desktop", "mobile", "mobile", "desktop", "tablet"];
const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
const oses = ["Windows", "macOS", "Android", "iOS"];
const cityByCountry = {
  US: ["New York", "Austin", "Chicago", "Seattle", "Miami"],
  CA: ["Toronto"],
  GB: ["London"],
  DE: ["Berlin"],
};
const isps = [
  "Comcast Cable",
  "AT&T Internet",
  "Verizon Fios",
  "Spectrum",
  "T-Mobile USA",
  "Cox Communications",
];
const dcIsps = ["Amazon AWS", "Google Cloud", "DigitalOcean", "OVH", "Hetzner"];
const byte = () => 1 + Math.floor(Math.random() * 254);
const randomIp = () => `${byte()}.${byte()}.${byte()}.${byte()}`;

// Clicks
for (let i = 0; i < 80; i++) {
  const r = Math.random();
  const status = r < 0.72 ? "VALID" : r < 0.9 ? "SUSPICIOUS" : "INVALID";
  const flags =
    status === "VALID"
      ? []
      : status === "SUSPICIOUS"
        ? [pick(["DUP_IP", "VPN", "NO_ACCEPT_LANGUAGE"])]
        : [pick(["BOT_UA", "DATACENTER", "SELF_CLICK"])];
  const score =
    status === "VALID"
      ? Math.floor(Math.random() * 20)
      : status === "SUSPICIOUS"
        ? 40 + Math.floor(Math.random() * 25)
        : 75 + Math.floor(Math.random() * 25);
  const created = new Date(Date.now() - Math.random() * 14 * DAY);
  const country = pick(countries);
  const isDc = flags.includes("DATACENTER");
  const ip = randomIp();
  await db.query(
    `INSERT INTO "Click" (id,"affiliateId","visitorId",ip,"ipHash",country,region,city,isp,device,browser,os,status,"fraudScore","isUnique","isBot","isProxy","isVpn","isDatacenter",flags,"createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::"ClickStatus",$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      id(),
      affiliateId,
      id().slice(0, 21),
      ip,
      crypto.randomBytes(8).toString("hex"),
      country,
      null,
      pick(cityByCountry[country] ?? ["—"]),
      isDc ? pick(dcIsps) : pick(isps),
      pick(devices),
      pick(browsers),
      pick(oses),
      status,
      score,
      status !== "SUSPICIOUS" || Math.random() > 0.4,
      flags.includes("BOT_UA"),
      flags.includes("VPN"),
      flags.includes("VPN"),
      isDc,
      flags,
      created,
    ],
  );
}

// Conversions + commissions
const plans = [
  { plan: "secure-basic", cycle: "monthly", amount: 8.49 },
  { plan: "secure-plus", cycle: "yearly", amount: 110.28 },
  { plan: "secure-pro", cycle: "yearly", amount: 206.28 },
  { plan: "starter", cycle: "monthly", amount: 1.0 },
];
let approvedCount = 0;
for (let i = 0; i < 16; i++) {
  const p = pick(plans);
  const r = Math.random();
  const status =
    r < 0.62
      ? "APPROVED"
      : r < 0.85
        ? "FLAGGED"
        : r < 0.95
          ? "PENDING"
          : "REJECTED";
  const flags =
    status === "APPROVED"
      ? []
      : [pick(["SUSPICIOUS_CLICK", "FAST_CONVERSION", "DUPLICATE_BUYER"])];
  const score =
    status === "APPROVED"
      ? Math.floor(Math.random() * 30)
      : status === "REJECTED"
        ? 78
        : 45 + Math.floor(Math.random() * 25);
  const created = new Date(Date.now() - Math.random() * 14 * DAY);
  const convId = id();
  await db.query(
    `INSERT INTO "Conversion" (id,"affiliateId",amount,currency,plan,cycle,status,"fraudScore",flags,"createdAt","updatedAt")
     VALUES ($1,$2,$3,'usd',$4,$5,$6::"ConversionStatus",$7,$8,$9,$9)`,
    [
      convId,
      affiliateId,
      p.amount,
      p.plan,
      p.cycle,
      status,
      score,
      flags,
      created,
    ],
  );
  if (status !== "REJECTED") {
    if (status === "APPROVED") approvedCount++;
    const commission = Math.round(p.amount * 0.3 * 100) / 100;
    // Most approved commissions are matured (available); flagged ones held (null).
    const payableAt =
      status === "APPROVED" ? new Date(created.getTime() + DAY) : null;
    await db.query(
      `INSERT INTO "Commission" (id,"affiliateId","conversionId",amount,type,rate,status,"payableAt","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,'PERCENT'::"CommissionType",30,'PENDING'::"CommissionStatus",$5,$6,$6)`,
      [id(), affiliateId, convId, commission, payableAt, created],
    );
  }
  if (flags.length > 0) {
    await db.query(
      `INSERT INTO "FraudEvent" (id,"affiliateId","conversionId",scope,type,severity,detail,"createdAt")
       VALUES ($1,$2,$3,'CONVERSION',$4,$5,$6,$7)`,
      [id(), affiliateId, convId, flags[0], score, flags.join(", "), created],
    );
  }
}

await db.end();
console.log(
  `✓ Seeded demo data for affiliate ${affiliateId}: 80 clicks, 16 conversions (${approvedCount} approved).`,
);
