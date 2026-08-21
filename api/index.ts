import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load compiled server app using robust CommonJS require
const appModule = require('../server/dist/app.js');
const app = appModule.default || appModule;

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
