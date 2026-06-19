// Promote a signed-up user to admin.
//   node scripts/make-admin.mjs you@example.com
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const env = fs.readFileSync(path.join(root, ".env"), "utf8");
const url = env.match(/DATABASE_URL="([^"]+)"/)[1];

const client = new pg.Client({ connectionString: url });
await client.connect();
const res = await client.query(
  `UPDATE "user" SET role = 'admin' WHERE email = $1 RETURNING email, role`,
  [email],
);
await client.end();

if (res.rowCount === 0) {
  console.error(`No user found with email ${email}. Sign up at /join first.`);
  process.exit(1);
}
console.log(`✓ ${res.rows[0].email} is now ${res.rows[0].role}`);
