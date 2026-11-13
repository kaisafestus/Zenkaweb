import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getStkTransactionStatus,
  handleStkCallback,
  initiateStkPush,
} from './server/stkService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '16kb' }));

  app.post('/api/stk/initiate', async (req: Request, res: Response) => {
    const result = await initiateStkPush(req.body ?? {}, extractClientIp(req));
    res.status(result.httpStatus).json(result.body);
  });

  app.get('/api/stk/status', async (req: Request, res: Response) => {
    const checkoutRequestId =
      typeof req.query.checkoutRequestId === 'string'
        ? req.query.checkoutRequestId
        : '';
    const sessionToken =
      typeof req.headers['x-session-token'] === 'string'
        ? req.headers['x-session-token']
        : '';

    const result = await getStkTransactionStatus(
      checkoutRequestId,
      sessionToken,
      extractClientIp(req)
    );
    res.status(result.httpStatus).json(result.body);
  });

  app.post('/api/stk/callback', (req: Request, res: Response) => {
    const token =
      typeof req.query.token === 'string' ? req.query.token : '';
    const result = handleStkCallback(token, req.body);
    res.status(result.httpStatus).json(result.body);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zenka Web server listening on port ${PORT}`);
  });
}

startServer();
