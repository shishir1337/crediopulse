// Dev helper: run an ad-hoc SQL query against DATABASE_URL.
//   node scripts/dbq.mjs "select * from \"Affiliate\""
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const env = fs.readFileSync(path.join(root, ".env"), "utf8");
const url = env.match(/DATABASE_URL="([^"]+)"/)[1];

const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(process.argv[2]);
console.log(JSON.stringify(r.rows, null, 2));
await client.end();
