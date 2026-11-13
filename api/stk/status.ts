import type { IncomingMessage, ServerResponse } from 'node:http';
import { getStkTransactionStatus } from '../../server/stkService.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Method not allowed.' }));
    return;
  }

  const url = new URL(req.url ?? '', 'https://localhost');
  const checkoutRequestId = url.searchParams.get('checkoutRequestId') ?? '';
  const sessionToken =
    typeof req.headers['x-session-token'] === 'string'
      ? req.headers['x-session-token']
      : '';

  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' && forwarded.length > 0
      ? forwarded.split(',')[0].trim()
      : req.socket?.remoteAddress ?? 'unknown';

  const result = await getStkTransactionStatus(
    checkoutRequestId,
    sessionToken,
    ip
  );
  res.statusCode = result.httpStatus;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result.body));
}
