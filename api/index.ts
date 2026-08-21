import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/dist/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const xMatched = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
  const pathParam = req.query?.path;

  if (xMatched && xMatched.startsWith('/api/')) {
    req.url = xMatched;
  } else if (pathParam) {
    const cleanPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    req.url = `/api/${cleanPath}`;
  }

  (req as any).originalUrl = req.url;
  return app(req, res);
}
