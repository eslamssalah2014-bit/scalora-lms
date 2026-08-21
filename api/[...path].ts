import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/dist/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // If Vercel passed query.path from catch-all [...path], normalize req.url
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${segments}`;
  }
  return app(req, res);
}
