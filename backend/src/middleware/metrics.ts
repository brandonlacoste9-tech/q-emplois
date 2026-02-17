/**
 * RBQ API Metrics — Logs structurés + métriques pour subventions
 * Latence, taux de succès, volume, erreurs par type
 * Schema: rbq_metrics_v1 — request_id pour corrélation
 */

import type { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { shipLog, type RbqLogEvent } from './logShipper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METRICS_FILE = path.resolve(__dirname, '../../data/metrics.json');
const MAX_LATENCIES = 1000;
const PERSIST_INTERVAL_MS = 60_000; // 1 min
const SCHEMA_VERSION = 'rbq_metrics_v1';

export interface RbqMetricsSnapshot {
  schema_version: string;
  timestamp: string;
  total_requests: number;
  success_count: number;
  valid_count: number;
  invalid_count: number;
  error_count: number;
  success_rate_pct: number;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_breakdown: Record<string, number>;
  licence_prefix_counts: Record<string, number>;
}

interface RbqRecord {
  licence: string;
  valid: boolean;
  latency_ms: number;
  status: number;
  error_type?: string;
  timestamp: string;
  request_id?: string;
}

const metrics = {
  requests: 0,
  success_count: 0,
  valid_count: 0,
  invalid_count: 0,
  error_count: 0,
  latencies: [] as number[],
  error_breakdown: {} as Record<string, number>,
  licence_prefix_counts: {} as Record<string, number>,
  records: [] as RbqRecord[],
  max_records: 500,
  _persistTimer: null as ReturnType<typeof setInterval> | null,

  recordRbq(record: RbqRecord) {
    this.requests++;
    this.latencies.push(record.latency_ms);
    if (this.latencies.length > MAX_LATENCIES) this.latencies.shift();

    const prefix = record.licence.substring(0, 4);
    this.licence_prefix_counts[prefix] = (this.licence_prefix_counts[prefix] ?? 0) + 1;

    if (record.status >= 400) {
      this.error_count++;
      const errType = record.error_type ?? `http_${record.status}`;
      this.error_breakdown[errType] = (this.error_breakdown[errType] ?? 0) + 1;
    } else {
      this.success_count++;
      if (record.valid) this.valid_count++;
      else this.invalid_count++;
    }

    this.records.push(record);
    if (this.records.length > this.max_records) this.records.shift();
  },

  toJSON(): RbqMetricsSnapshot {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const len = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      schema_version: SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      total_requests: this.requests,
      success_count: this.success_count,
      valid_count: this.valid_count,
      invalid_count: this.invalid_count,
      error_count: this.error_count,
      success_rate_pct: this.requests > 0 ? Math.round((this.success_count / this.requests) * 10000) / 100 : 0,
      avg_latency_ms: len > 0 ? Math.round((sum / len) * 100) / 100 : 0,
      p50_latency_ms: len > 0 ? Math.round((sorted[Math.floor(len * 0.5)] ?? 0) * 100) / 100 : 0,
      p95_latency_ms: len > 0 ? Math.round((sorted[Math.floor(len * 0.95)] ?? 0) * 100) / 100 : 0,
      p99_latency_ms: len > 0 ? Math.round((sorted[Math.floor(len * 0.99)] ?? 0) * 100) / 100 : 0,
      error_breakdown: { ...this.error_breakdown },
      licence_prefix_counts: { ...this.licence_prefix_counts },
    };
  },

  async persist() {
    try {
      const dir = path.dirname(METRICS_FILE);
      await fs.mkdir(dir, { recursive: true });
      const data = {
        snapshot: this.toJSON(),
        recent_records: this.records.slice(-100),
        persisted_at: new Date().toISOString(),
      };
      await fs.writeFile(METRICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[metrics] persist failed:', err);
    }
  },

  startPersistInterval() {
    if (this._persistTimer) return;
    this._persistTimer = setInterval(() => this.persist(), PERSIST_INTERVAL_MS);
  },

  stopPersistInterval() {
    if (this._persistTimer) {
      clearInterval(this._persistTimer);
      this._persistTimer = null;
    }
  },
};

/** Log structuré JSON pour chaque requête RBQ */
export function logRbqRequest(
  req: Request,
  res: Response,
  licence: string,
  result: { valid?: boolean; error?: string },
  latencyMs: number,
  statusOverride?: number
) {
  const status = statusOverride ?? res.statusCode;
  const errorType = status >= 400 ? (result.error ?? `http_${status}`) : undefined;
  const requestId = req.requestId ?? `gen-${Date.now()}`;

  const logEvent: RbqLogEvent = {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status,
    latency_ms: Math.round(latencyMs * 100) / 100,
    licence_prefix: licence.substring(0, 4),
    valid: result.valid ?? null,
    error: result.error ?? null,
    error_type: errorType,
    user_agent: req.get('user-agent') ?? undefined,
  };
  console.log(JSON.stringify(logEvent));

  shipLog(logEvent);

  metrics.recordRbq({
    licence,
    valid: result.valid ?? false,
    latency_ms: latencyMs,
    status,
    error_type: errorType,
    timestamp: logEvent.timestamp,
    request_id: requestId,
  });
}

/** Middleware optionnel : log toutes les requêtes API (pour debug) */
export function requestLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency_ms: Math.round(duration * 100) / 100,
    };
    if (req.path.includes('/api/')) {
      console.log(JSON.stringify(log));
    }
  });
  next();
}

export { metrics };
