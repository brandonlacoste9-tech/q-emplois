/**
 * Configure Render env vars for q-emplois API (merge with existing).
 * Reads secrets from backend/.env locally; does not print values.
 *
 * Usage: node scripts/render-setup-env.mjs
 */
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const SERVICE_ID = 'srv-d8q5boog4nts7382a5hg';
const RENDER_API = 'https://api.render.com/v1';

function loadRenderApiKey() {
  if (process.env.RENDER_API_KEY) return process.env.RENDER_API_KEY;
  const cliPath = path.join(process.env.USERPROFILE || process.env.HOME, '.render', 'cli.yaml');
  const raw = fs.readFileSync(cliPath, 'utf8');
  const match = raw.match(/key:\s*(rnd_\S+)/);
  if (!match) throw new Error('Render API key not found. Run: render login');
  return match[1];
}

function parseDotEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function sessionPoolerUrl(fromUrl) {
  const url = new URL(fromUrl);
  url.port = '5432';
  url.search = '';
  return url.toString();
}

async function renderFetch(apiKey, method, pathSuffix, body) {
  const res = await fetch(`${RENDER_API}${pathSuffix}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Render API ${method} ${pathSuffix} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const apiKey = loadRenderApiKey();
  const localEnv = parseDotEnv(path.join(process.cwd(), 'backend', '.env'));

  if (!localEnv.DATABASE_URL) {
    throw new Error('backend/.env missing DATABASE_URL');
  }

  const databaseUrl = sessionPoolerUrl(localEnv.DATABASE_URL);
  const jwtSecret =
    process.env.JWT_SECRET ||
    (localEnv.JWT_SECRET && localEnv.JWT_SECRET.length >= 32
      ? localEnv.JWT_SECRET
      : crypto.randomBytes(32).toString('base64'));

  const desired = {
    NODE_ENV: 'production',
    DATABASE_URL: databaseUrl,
    MIGRATE_DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRATION: localEnv.JWT_EXPIRATION || '24h',
    JWT_REFRESH_EXPIRATION: localEnv.JWT_REFRESH_EXPIRATION || '7d',
    CORS_ORIGIN: 'https://q-emplois.vercel.app',
    FRONTEND_URL: 'https://q-emplois.vercel.app',
    SUPABASE_URL: 'https://masefoylqhqfijszezla.supabase.co',
    PORT: '3000',
  };

  const existingResp = await renderFetch(apiKey, 'GET', `/services/${SERVICE_ID}/env-vars`);
  const existing = {};
  for (const row of existingResp || []) {
    if (row?.envVar?.key) existing[row.envVar.key] = row.envVar.value ?? '';
  }

  const merged = { ...existing, ...desired };
  const payload = Object.entries(merged).map(([key, value]) => ({ key, value }));

  await renderFetch(apiKey, 'PUT', `/services/${SERVICE_ID}/env-vars`, payload);

  console.log('Updated Render env vars (merged):');
  for (const key of Object.keys(desired).sort()) {
    console.log(`  - ${key}`);
  }

  const deploy = await renderFetch(apiKey, 'POST', `/services/${SERVICE_ID}/deploys`, { clearCache: 'do_not_clear' });
  console.log(`Deploy triggered: ${deploy?.id || 'ok'}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
