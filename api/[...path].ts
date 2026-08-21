import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${segments}`;
  }
  return app(req, res);
}
