import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../../server/dist/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query?.path;
  if (pathParam) {
    const cleanPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    req.url = `/api/${cleanPath}`;
    (req as any).originalUrl = `/api/${cleanPath}`;
  }
  return app(req, res);
}
