import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: join(root, ".env.local") });

const DEFAULT_REGIONS = [
  "ap-southeast-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "sa-east-1",
  "ca-central-1",
];

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  return new URL(url).hostname.split(".")[0];
}

function candidateUrls() {
  if (process.env.DATABASE_URL) return [process.env.DATABASE_URL];

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = getProjectRef();
  if (!password || !ref) {
    console.error(`
Missing DB credentials.

Add to .env.local:

  SUPABASE_DB_PASSWORD=your-database-password

Or the pooler URI from Supabase → Project Settings → Database → Connect:

  DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
`);
    process.exit(1);
  }

  const encoded = encodeURIComponent(password);
  const urls = [];
  const preferred = process.env.SUPABASE_DB_REGION;
  const regions = preferred
    ? [preferred, ...DEFAULT_REGIONS.filter((r) => r !== preferred)]
    : DEFAULT_REGIONS;

  // Prefer pooler (works on free tier / IPv4 networks)
  for (const region of regions) {
    urls.push(
      `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    );
    urls.push(
      `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    );
  }

  // Direct host last (often IPv6-only / may not resolve)
  urls.push(`postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`);

  return urls;
}

async function connectWithFallback() {
  const urls = candidateUrls();
  let lastError = null;

  for (const connectionString of urls) {
    const host = connectionString.split("@")[1]?.split("/")[0] ?? "unknown";
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      return client;
    } catch (err) {
      lastError = err;
      await client.end().catch(() => undefined);
    }
  }

  throw lastError ?? new Error("Could not connect");
}

async function main() {
  const migrationsDir = join(root, "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No SQL migrations found in supabase/migrations");
    process.exit(1);
  }

  console.log("Connecting to Supabase Postgres…");
  const client = await connectWithFallback();

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      console.log(`Running ${file}…`);
      await client.query(sql);
      console.log(`✓ ${file}`);
    }
    console.log("All migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  console.error(`
If this keeps failing, open Supabase → Project Settings → Database → Connect,
copy the **Transaction** pooler URI, put it in .env.local as DATABASE_URL, then retry:

  npm run db:migrate
`);
  process.exit(1);
});
