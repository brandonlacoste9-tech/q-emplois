/**
 * Log Shipper — Export vers Axiom ou Datadog (fire-and-forget)
 * Active si AXIOM_TOKEN+AXIOM_DATASET ou DD_API_KEY sont définis
 *
 * Privacy: Ne jamais envoyer le numéro RBQ complet — licence_prefix uniquement.
 */

import { gzipSync } from 'zlib';

export interface RbqLogEvent {
  schema_version: string;
  request_id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latency_ms: number;
  licence_prefix: string; // Jamais le numéro complet — conformité vie privée
  valid: boolean | null;
  error: string | null;
  error_type?: string; // Stable, low-cardinality (http_400, timeout, format_invalid, etc.)
  user_agent?: string;
}

const BATCH_SIZE = 10;
const FLUSH_MS = 5000;
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503]);

let buffer: RbqLogEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getAxiomConfig() {
  const token = process.env.AXIOM_TOKEN;
  const dataset = process.env.AXIOM_DATASET;
  const domain = process.env.AXIOM_DOMAIN ?? 'api.axiom.co';
  return token && dataset ? { token, dataset, domain } : null;
}

function getDatadogConfig() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE ?? 'datadoghq.com';
  const service = process.env.DD_SERVICE ?? 'q-emplois-backend';
  const env = process.env.DD_ENV ?? process.env.NODE_ENV ?? 'development';
  return apiKey ? { apiKey, site, service, env } : null;
}

function getDatadogIntakeHost(site: string): string {
  const map: Record<string, string> = {
    'datadoghq.com': 'http-intake.logs.datadoghq.com',
    'datadoghq.eu': 'http-intake.logs.datadoghq.eu',
    'us3.datadoghq.com': 'http-intake.logs.us3.datadoghq.com',
    'us5.datadoghq.com': 'http-intake.logs.us5.datadoghq.com',
    'ap1.datadoghq.com': 'http-intake.logs.ap1.datadoghq.com',
    'ap2.datadoghq.com': 'http-intake.logs.ap2.datadoghq.com',
    'ddog-gov.com': 'http-intake.logs.ddog-gov.com',
  };
  return map[site] ?? `http-intake.logs.${site}`;
}

export function shipLog(event: RbqLogEvent) {
  buffer.push(event);
  if (buffer.length >= BATCH_SIZE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setInterval(flush, FLUSH_MS);
  }
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  const axiom = getAxiomConfig();
  const dd = getDatadogConfig();

  const promises: Promise<void>[] = [];
  if (axiom) promises.push(shipToAxiom(batch, axiom));
  if (dd) promises.push(shipToDatadog(batch, dd));

  Promise.allSettled(promises).catch((err) => {
    console.error('[logShipper] flush error:', err);
  });
}

async function shipToAxiom(
  events: RbqLogEvent[],
  config: { token: string; dataset: string; domain: string }
) {
  // api.axiom.co: /v1/ingest/{dataset} | edge: /v1/ingest/{dataset}
  const url = `https://${config.domain}/v1/ingest/${config.dataset}`;
  const body = events.map((e) => ({ ...e, _time: e.timestamp }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Axiom ingest failed: ${res.status} ${text}`);
  }

  const result = (await res.json()) as { ingested?: number; failed?: number; failures?: unknown[] };
  if (result.failed && result.failed > 0) {
    console.warn('[logShipper] Axiom partial failure:', result);
  }
}

async function shipToDatadog(
  events: RbqLogEvent[],
  config: { apiKey: string; site: string; service: string; env: string }
) {
  const host = getDatadogIntakeHost(config.site);
  const url = `https://${host}/v1/input`;

  const body = events.map((e) => {
    const tags = [
      `service:${config.service}`,
      `env:${config.env}`,
      `path:${e.path.replace(/^\/+/, '').replace(/\//g, '.')}`,
      `http_status:${e.status}`,
      `valid:${String(e.valid ?? 'unknown')}`,
    ];
    return {
      message: JSON.stringify(e),
      ddsource: 'q-emplois',
      ddtags: tags.join(','),
      service: config.service,
      hostname: process.env.HOSTNAME ?? 'localhost',
    };
  });

  const payload = JSON.stringify(body);
  const compressed = gzipSync(Buffer.from(payload, 'utf-8'));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'DD-API-KEY': config.apiKey,
      },
      body: compressed,
    });

    if (res.ok) return;

    if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES - 1) {
      const delay = Math.min(1000 * 2 ** attempt, 10000);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    throw new Error(`Datadog ingest failed: ${res.status} ${await res.text()}`);
  }
}
