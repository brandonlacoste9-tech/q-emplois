/**
 * Metrics Auth — Protège /metrics et /metrics/dashboard en prod
 * Si METRICS_API_KEY est défini, exige X-API-Key ou ?api_key=
 * /health reste public
 */

import type { Request, Response, NextFunction } from 'express';

export function metricsAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = process.env.METRICS_API_KEY;
  if (!key) {
    return next(); // Pas de clé = accès libre (dev)
  }

  const provided = req.get('x-api-key') || req.query.api_key;
  if (provided === key) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized', message: 'Metrics API key required' });
}
