import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/dist/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-now-route-matches']) as string;
  if (matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  }
  return app(req, res);
}
