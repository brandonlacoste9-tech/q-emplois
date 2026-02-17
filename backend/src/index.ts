/**
 * Q-emplois Backend API
 * Endpoints: POST /api/bids, POST /api/leads (Max TI-GUY), POST /api/verify/rbq
 * Monitoring: GET /metrics, GET /health, GET /metrics/dashboard
 */

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';

import { metrics, logRbqRequest } from './middleware/metrics.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { metricsAuthMiddleware } from './middleware/metricsAuth.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { desc } from 'drizzle-orm';
import { db } from './db/index.js';
import { leads, traction } from './db/schema.js';
import { soumettreOffre } from './actions/soumissionner.js';
import { ingesterLead } from './actions/ingesterLeads.js';
import { logTraction } from './actions/logTraction.js';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use(requestIdMiddleware);

// Log structuré pour les requêtes API
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    if (req.path.startsWith('/api/') && !req.path.includes('/metrics')) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          status: res.statusCode,
          latency_ms: Math.round(duration * 100) / 100,
        })
      );
    }
  });
  next();
});

app.post('/api/bids', async (req, res) => {
  const body = req.body;
  const result = await soumettreOffre({
    jobId: body.jobId,
    proId: body.proId,
    price: Number(body.price),
    priceType: body.priceType,
    message: body.message,
  });

  if (result.success) {
    return res.status(201).json(result);
  }
  return res.status(400).json(result);
});

// Pont Max (TI-GUY) → L'Atelier
app.post('/api/leads', async (req, res) => {
  const result = await ingesterLead(req.body);
  if (result.success) {
    return res.status(201).json(result);
  }
  return res.status(400).json(result);
});

app.get('/api/leads', async (_req, res) => {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return res.json(
    rows.map((r) => ({
      id: r.id,
      titre: r.titre,
      client: r.client,
      localisation: r.localisation,
      montant_net: Number(r.montantNet),
      tps: Number(r.tps),
      tvq: Number(r.tvq),
      total_coffre_fort: Number(r.montantNet) + Number(r.tps) + Number(r.tvq),
      sceau_authenticite: r.sceauAuthenticite,
      source: r.source,
      status: r.status,
      created_at: r.createdAt,
    }))
  );
});

// Traction API — Événements haute valeur (Grant Strategy)
app.post('/api/traction/log', async (req, res) => {
  const result = await logTraction(req.body);
  if (result.success) {
    return res.status(201).json(result);
  }
  return res.status(500).json(result);
});

// RBQ Licence Verification — appelle tools/rbq_verifier
const RBQ_SCRIPT_DIR = path.resolve(__dirname, '../../tools/rbq_verifier');
const RBQ_LICENCE_PATTERN = /^\d{4}-\d{4}(-\d{2})?$/;

app.post('/api/verify/rbq', async (req, res) => {
  const start = performance.now();
  const { licence } = req.body ?? {};
  const raw = String(licence ?? '').trim().replace(/\D/g, '');
  const normalized =
    raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw.length === 10 ? `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}` : null;

  if (!normalized || !RBQ_LICENCE_PATTERN.test(normalized)) {
    const latencyMs = performance.now() - start;
    logRbqRequest(req, res, raw || 'invalid', { valid: false, error: 'Format invalide' }, latencyMs, 400);
    return res.status(400).json({
      valid: false,
      licence: licence ?? null,
      error: 'Format invalide. Utilisez 1234-5678 ou 1234-5678-91.',
    });
  }

  try {
    const cmd = `uv run rbq_verify.py --json ${normalized}`;
    const { stdout } = await execAsync(cmd, {
      cwd: RBQ_SCRIPT_DIR,
      timeout: 120_000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    const result = JSON.parse(stdout.trim());
    const latencyMs = performance.now() - start;
    logRbqRequest(req, res, normalized, { valid: result.valid, error: result.error }, latencyMs);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const latencyMs = performance.now() - start;
    logRbqRequest(req, res, normalized, { valid: false, error: message }, latencyMs, 500);
    return res.status(500).json({
      valid: false,
      licence: normalized,
      error: 'Vérification échouée',
      details: message,
    });
  }
});

// Health — Public (pour load balancers, k8s probes)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime_seconds: Math.round(process.uptime()),
    metrics: metrics.toJSON(),
  });
});

// Metrics — Protégé si METRICS_API_KEY défini (X-API-Key ou ?api_key=)
app.get('/metrics', metricsAuthMiddleware, (_req, res) => {
  res.json(metrics.toJSON());
});

app.get('/metrics/dashboard', metricsAuthMiddleware, (_req, res) => {
  const m = metrics.toJSON();
  res.type('html').send(`
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>RBQ API Metrics</title></head>
<body style="font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto;">
  <h1>📊 RBQ API Metrics</h1>
  <pre style="background: #1a1a2e; color: #e8e0d4; padding: 1.5rem; border-radius: 8px; overflow-x: auto;">${JSON.stringify(m, null, 2)}</pre>
  <p style="color: #666;">Dernière mise à jour: ${new Date().toISOString()}</p>
  <script>setTimeout(() => location.reload(), 5000)</script>
</body>
</html>`);
});

// Traction Summary — Pour dossiers de subvention et investisseurs
app.get('/api/traction/summary', async (_req, res) => {
  const [tractionRows, leadRows] = await Promise.all([
    db.select().from(traction),
    db.select({ id: leads.id, tps: leads.tps, tvq: leads.tvq }).from(leads),
  ]);
  const leadClaims = tractionRows.filter((r) => r.eventType === 'lead_claim');
  const partnerClicks = tractionRows.filter((r) => r.eventType === 'partner_click');
  const claimedLeadIds = new Set(leadClaims.map((r) => r.leadId).filter(Boolean));
  const leadMap = new Map(leadRows.map((l) => [l.id, l]));
  let tpsTvqTotal = 0;
  for (const lid of claimedLeadIds) {
    const lead = leadMap.get(lid!);
    if (lead) tpsTvqTotal += Number(lead.tps) + Number(lead.tvq);
  }
  return res.json({
    total_events: tractionRows.length,
    total_leads: leadRows.length,
    lead_claims: leadClaims.length,
    partner_clicks: partnerClicks.length,
    tps_tvq_traced: Math.round(tpsTvqTotal * 100) / 100,
    conversion_rate: leadRows.length > 0
      ? Math.round((leadClaims.length / leadRows.length) * 10000) / 100
      : 0,
    by_region: tractionRows.reduce(
      (acc, r) => {
        const region = (r.metadata as { region?: string })?.region ?? 'Non spécifié';
        acc[region] = (acc[region] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    recent: tractionRows.slice(-20).map((r) => ({
      id: r.id,
      event_type: r.eventType,
      pro_id: r.proId,
      lead_id: r.leadId,
      created_at: r.createdAt,
    })),
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Q-emplois API running on http://localhost:${PORT}`);
  metrics.startPersistInterval();
});

process.on('SIGTERM', () => {
  metrics.stopPersistInterval();
  metrics.persist();
  server.close();
});
