/**
 * Request ID — Corrélation skill OpenClaw → backend → scraper
 * Génère un request_id si absent (X-Request-ID ou header personnalisé)
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.requestId = (req.get(REQUEST_ID_HEADER) as string) || randomUUID();
  next();
}
