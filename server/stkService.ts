import crypto from 'node:crypto';
import {
  calculateExtensionFee,
  findExactLoanTier,
  maskPhoneNumber,
  normalizeMpesaPhone254,
} from '../shared/loanSchedule.ts';

export type StkIntentType = 'loan_fee' | 'extension_fee';
export type StkStatusValue =
  | 'sent'
  | 'pending'
  | 'success'
  | 'cancelled'
  | 'timeout';

export interface InitiateStkInput {
  intentType?: unknown;
  tierPrincipal?: unknown;
  extensionDays?: unknown;
  phoneNumber?: unknown;
  fullName?: unknown;
  nationalId?: unknown;
  idempotencyKey?: unknown;
}

interface StoredTransaction {
  checkoutRequestId: string;
  merchantRequestId?: string;
  transactionId?: string;
  sessionToken: string;
  idempotencyKey: string;
  intentType: StkIntentType;
  tierPrincipal: number;
  amount: number;
  maskedPhone: string;
  status: StkStatusValue;
  createdAt: number;
  updatedAt: number;
}

interface ServiceResult<T> {
  httpStatus: number;
  body: T;
}

const UPESIPAY_BASE_URL = 'https://upesipay.com/api/v2';
const SESSION_TTL_MS = 30 * 60 * 1000;
const STK_TIMEOUT_MS = 65 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_INITIATE_PER_MIN = 5;
const MAX_STATUS_PER_MIN = 40;
const PHONE_COOLDOWN_MS = 10 * 1000;

const transactionsByCheckoutId = new Map<string, StoredTransaction>();
const idempotencyCache = new Map<
  string,
  { checkoutRequestId: string; expiresAt: number }
>();
const ipRateBuckets = new Map<string, number[]>();
const phoneCooldowns = new Map<string, number>();

function pruneExpiredState(now: number): void {
  for (const [id, tx] of transactionsByCheckoutId.entries()) {
    if (now - tx.createdAt > SESSION_TTL_MS) {
      transactionsByCheckoutId.delete(id);
    }
  }
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now > entry.expiresAt) {
      idempotencyCache.delete(key);
    }
  }
  for (const [phone, ts] of phoneCooldowns.entries()) {
    if (now - ts > PHONE_COOLDOWN_MS) {
      phoneCooldowns.delete(phone);
    }
  }
}

export function checkRateLimit(
  ip: string,
  bucketPrefix: 'initiate' | 'status'
): boolean {
  const now = Date.now();
  const limit =
    bucketPrefix === 'initiate' ? MAX_INITIATE_PER_MIN : MAX_STATUS_PER_MIN;
  const key = `${bucketPrefix}:${ip}`;
  const timestamps = (ipRateBuckets.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= limit) {
    ipRateBuckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  ipRateBuckets.set(key, timestamps);
  return true;
}

function getUpesipayConfig(): {
  authHeader: string;
  channelId: number;
  callbackSecret: string;
} | null {
  const basicOverride = process.env.UPESIPAY_BASIC_AUTH?.trim();
  const username = process.env.UPESIPAY_API_USERNAME?.trim();
  const password = process.env.UPESIPAY_API_PASSWORD?.trim();
  const channelRaw = process.env.UPESIPAY_CHANNEL_ID?.trim();

  if (!channelRaw || !/^\d+$/.test(channelRaw)) {
    return null;
  }
  const channelId = Number(channelRaw);

  let authHeader = '';
  if (basicOverride) {
    authHeader = basicOverride.startsWith('Basic ')
      ? basicOverride
      : `Basic ${basicOverride}`;
  } else if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString(
      'base64'
    );
    authHeader = `Basic ${encoded}`;
  } else {
    return null;
  }

  const explicitSecret = process.env.UPESIPAY_CALLBACK_SECRET?.trim();
  const callbackSecret =
    explicitSecret && explicitSecret.length >= 16
      ? explicitSecret
      : crypto
          .createHmac('sha256', authHeader)
          .update('zenka-upesipay-callback')
          .digest('hex');

  return { authHeader, channelId, callbackSecret };
}

function getPublicCallbackUrl(callbackSecret: string): string | undefined {
  const appUrl = process.env.APP_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim()
    ? `https://${process.env.VERCEL_URL.trim()}`
    : undefined;
  const base = appUrl || vercelUrl;
  if (!base || !base.startsWith('https://')) {
    return undefined;
  }
  const normalizedBase = base.replace(/\/+$/, '');
  return `${normalizedBase}/api/stk/callback?token=${encodeURIComponent(callbackSecret)}`;
}

function constantTimeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function mapExternalStatus(rawStatus: unknown): StkStatusValue {
  if (typeof rawStatus !== 'string') return 'pending';
  const normalized = rawStatus.trim().toLowerCase();
  if (
    normalized === 'success' ||
    normalized === 'completed' ||
    normalized === 'paid'
  ) {
    return 'success';
  }
  if (
    normalized === 'failed' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'rejected'
  ) {
    return 'cancelled';
  }
  if (normalized === 'timeout' || normalized === 'expired') {
    return 'timeout';
  }
  if (normalized === 'sent') {
    return 'sent';
  }
  return 'pending';
}

function createSignedSessionToken(
  checkoutRequestId: string,
  amount: number,
  maskedPhone: string,
  iat: number,
  signingSecret: string,
  transactionId?: string,
  merchantRequestId?: string
): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: checkoutRequestId,
      tid: transactionId ?? null,
      mrid: merchantRequestId ?? null,
      amt: amount,
      ph: maskedPhone,
      iat,
      exp: iat + SESSION_TTL_MS,
    }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedSessionToken(
  token: string,
  expectedCheckoutId: string,
  signingSecret: string
): {
  amount: number;
  maskedPhone: string;
  iat: number;
  transactionId: string | null;
  merchantRequestId: string | null;
} | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('base64url');

  if (!constantTimeMatch(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as {
      id?: string;
      tid?: string | null;
      mrid?: string | null;
      amt?: number;
      ph?: string;
      iat?: number;
      exp?: number;
    };
    if (
      parsed.id !== expectedCheckoutId ||
      typeof parsed.amt !== 'number' ||
      typeof parsed.ph !== 'string' ||
      typeof parsed.iat !== 'number' ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
    return {
      amount: parsed.amt,
      maskedPhone: parsed.ph,
      iat: parsed.iat,
      transactionId: typeof parsed.tid === 'string' ? parsed.tid : null,
      merchantRequestId: typeof parsed.mrid === 'string' ? parsed.mrid : null,
    };
  } catch {
    return null;
  }
}

async function queryUpesipayTransactionStatus(
  authHeader: string,
  checkoutRequestId: string,
  transactionId: string | null,
  merchantRequestId: string | null,
  expectedAmount: number
): Promise<StkStatusValue | null> {
  const lookupIds = [transactionId, checkoutRequestId].filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );

  // 1. Direct transaction lookup: GET /api/v2/transactions/{id}/
  for (const id of lookupIds) {
    try {
      const res = await fetch(
        `${UPESIPAY_BASE_URL}/transactions/${encodeURIComponent(id)}/`,
        {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: { status?: unknown; amount?: unknown };
        } | null;

        if (json?.success && json.data) {
          const remoteAmt = Number(json.data.amount);
          if (!Number.isNaN(remoteAmt) && remoteAmt > 0 && remoteAmt !== expectedAmount) {
            return 'cancelled';
          }
          return mapExternalStatus(json.data.status);
        }
      }
    } catch {
      // Try next lookup strategy
    }
  }

  // 2. Fallback scan of recent transactions: GET /api/v2/transactions/?limit=20
  try {
    const listRes = await fetch(
      `${UPESIPAY_BASE_URL}/transactions/?limit=20`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (listRes.ok) {
      const listJson = (await listRes.json().catch(() => null)) as {
        success?: boolean;
        data?: Array<{
          id?: unknown;
          reference_id?: unknown;
          checkout_request_id?: unknown;
          merchant_request_id?: unknown;
          status?: unknown;
          amount?: unknown;
        }>;
      } | null;

      if (listJson?.success && Array.isArray(listJson.data)) {
        const match = listJson.data.find(
          (item) =>
            item.checkout_request_id === checkoutRequestId ||
            item.reference_id === checkoutRequestId ||
            item.id === checkoutRequestId ||
            (transactionId !== null && item.id === transactionId) ||
            (merchantRequestId !== null &&
              item.merchant_request_id === merchantRequestId)
        );
        if (match) {
          const remoteAmt = Number(match.amount);
          if (!Number.isNaN(remoteAmt) && remoteAmt > 0 && remoteAmt !== expectedAmount) {
            return 'cancelled';
          }
          return mapExternalStatus(match.status);
        }
      }
    }
  } catch {
    // Keep current known status
  }

  return null;
}

export async function initiateStkPush(
  input: InitiateStkInput,
  clientIp: string
): Promise<ServiceResult<Record<string, unknown>>> {
  const now = Date.now();
  pruneExpiredState(now);

  if (!checkRateLimit(clientIp, 'initiate')) {
    return {
      httpStatus: 429,
      body: {
        success: false,
        message: 'Too many payment attempts. Please wait a minute before trying again.',
      },
    };
  }

  const config = getUpesipayConfig();
  if (!config) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        message: 'Payment service is currently unavailable. Please try again later.',
      },
    };
  }

  const intentType = input.intentType;
  if (intentType !== 'loan_fee' && intentType !== 'extension_fee') {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Invalid checkout request type.' },
    };
  }

  const tierPrincipal = Number(input.tierPrincipal);
  const tier = Number.isInteger(tierPrincipal)
    ? findExactLoanTier(tierPrincipal)
    : null;
  if (!tier) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Selected loan package tier is invalid.' },
    };
  }

  let authoritativeAmount: number | null = null;
  if (intentType === 'loan_fee') {
    authoritativeAmount = tier.fee;
  } else {
    const extDays = Number(input.extensionDays);
    if (extDays !== 7 && extDays !== 14 && extDays !== 30) {
      return {
        httpStatus: 400,
        body: { success: false, message: 'Selected extension duration is invalid.' },
      };
    }
    authoritativeAmount = calculateExtensionFee(tier.principal, extDays);
  }

  if (
    authoritativeAmount === null ||
    authoritativeAmount < 1 ||
    authoritativeAmount > 500000
  ) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Calculated fee is outside allowed limits.' },
    };
  }

  const rawPhone = typeof input.phoneNumber === 'string' ? input.phoneNumber : '';
  const phone254 = normalizeMpesaPhone254(rawPhone);
  if (!phone254) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        message: 'Enter a valid Kenyan mobile number (e.g. 0712 345 678).',
      },
    };
  }

  const fullName =
    typeof input.fullName === 'string' ? input.fullName.trim() : '';
  if (fullName.length < 2 || fullName.length > 80) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Please provide your full legal name.' },
    };
  }

  if (intentType === 'loan_fee') {
    const nationalId =
      typeof input.nationalId === 'string' ? input.nationalId.trim() : '';
    if (!/^\d{6,10}$/.test(nationalId)) {
      return {
        httpStatus: 400,
        body: {
          success: false,
          message: 'Enter a valid Kenyan National ID (6–10 digits).',
        },
      };
    }
  }

  const idempotencyKey =
    typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
  if (!/^[a-zA-Z0-9_-]{12,64}$/.test(idempotencyKey)) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Invalid payment session. Please retry.' },
    };
  }

  const existingIdem = idempotencyCache.get(idempotencyKey);
  if (existingIdem) {
    const existingTx = transactionsByCheckoutId.get(existingIdem.checkoutRequestId);
    if (existingTx) {
      return {
        httpStatus: 200,
        body: {
          success: true,
          checkoutRequestId: existingTx.checkoutRequestId,
          sessionToken: existingTx.sessionToken,
          amount: existingTx.amount,
          maskedPhone: existingTx.maskedPhone,
          status: existingTx.status,
        },
      };
    }
  }

  const lastPhoneRequest = phoneCooldowns.get(phone254);
  if (lastPhoneRequest && now - lastPhoneRequest < PHONE_COOLDOWN_MS) {
    return {
      httpStatus: 429,
      body: {
        success: false,
        message: 'An M-Pesa prompt was just sent to this number. Please wait a few seconds.',
      },
    };
  }
  phoneCooldowns.set(phone254, now);

  const payload: Record<string, unknown> = {
    channel_id: config.channelId,
    phone_number: phone254,
    amount: authoritativeAmount,
  };

  const callbackUrl = getPublicCallbackUrl(config.callbackSecret);
  if (callbackUrl) {
    payload.callback_url = callbackUrl;
  }

  try {
    const upstreamRes = await fetch(`${UPESIPAY_BASE_URL}/collections/initiate/`, {
      method: 'POST',
      headers: {
        Authorization: config.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const upstreamData = (await upstreamRes.json().catch(() => null)) as {
      success?: boolean;
      data?: {
        id?: string;
        transaction_id?: string;
        checkout_request_id?: string;
        merchant_request_id?: string;
        status?: string;
      };
    } | null;

    if (
      !upstreamRes.ok ||
      !upstreamData?.success ||
      !upstreamData?.data?.checkout_request_id
    ) {
      const safeStatus = upstreamRes.status === 400 ? 400 : 502;
      return {
        httpStatus: safeStatus,
        body: {
          success: false,
          message:
            safeStatus === 400
              ? 'Please confirm your M-Pesa phone number and try again.'
              : 'Unable to reach M-Pesa prompt service right now. Please try again shortly.',
        },
      };
    }

    const checkoutRequestId = upstreamData.data.checkout_request_id;
    const merchantRequestId =
      typeof upstreamData.data.merchant_request_id === 'string'
        ? upstreamData.data.merchant_request_id
        : undefined;
    const transactionId =
      typeof upstreamData.data.transaction_id === 'string'
        ? upstreamData.data.transaction_id
        : typeof upstreamData.data.id === 'string'
          ? upstreamData.data.id
          : undefined;

    const maskedPhone = maskPhoneNumber(phone254);
    const sessionToken = createSignedSessionToken(
      checkoutRequestId,
      authoritativeAmount,
      maskedPhone,
      now,
      config.callbackSecret,
      transactionId,
      merchantRequestId
    );
    const status = mapExternalStatus(upstreamData.data.status ?? 'sent');

    const record: StoredTransaction = {
      checkoutRequestId,
      merchantRequestId,
      transactionId,
      sessionToken,
      idempotencyKey,
      intentType,
      tierPrincipal: tier.principal,
      amount: authoritativeAmount,
      maskedPhone,
      status,
      createdAt: now,
      updatedAt: now,
    };

    transactionsByCheckoutId.set(checkoutRequestId, record);
    idempotencyCache.set(idempotencyKey, {
      checkoutRequestId,
      expiresAt: now + SESSION_TTL_MS,
    });

    return {
      httpStatus: 200,
      body: {
        success: true,
        checkoutRequestId,
        sessionToken,
        amount: authoritativeAmount,
        maskedPhone,
        status,
      },
    };
  } catch {
    return {
      httpStatus: 504,
      body: {
        success: false,
        message: 'M-Pesa request timed out. Please try again in a moment.',
      },
    };
  }
}

export async function getStkTransactionStatus(
  checkoutRequestId: string,
  sessionToken: string,
  clientIp: string
): Promise<ServiceResult<Record<string, unknown>>> {
  const now = Date.now();
  pruneExpiredState(now);

  if (!checkRateLimit(clientIp, 'status')) {
    return {
      httpStatus: 429,
      body: { success: false, message: 'Status check rate limit reached. Please wait.' },
    };
  }

  if (!checkoutRequestId || !sessionToken) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Missing verification parameters.' },
    };
  }

  const config = getUpesipayConfig();
  if (!config) {
    return {
      httpStatus: 503,
      body: { success: false, message: 'Verification service unavailable.' },
    };
  }

  const verifiedToken = verifySignedSessionToken(
    sessionToken,
    checkoutRequestId,
    config.callbackSecret
  );
  if (!verifiedToken) {
    return {
      httpStatus: 403,
      body: { success: false, message: 'Transaction session not found or unauthorized.' },
    };
  }

  const record = transactionsByCheckoutId.get(checkoutRequestId);
  if (
    record &&
    (record.status === 'success' ||
      record.status === 'cancelled' ||
      record.status === 'timeout')
  ) {
    return {
      httpStatus: 200,
      body: {
        success: true,
        status: record.status,
        amount: verifiedToken.amount,
        maskedPhone: verifiedToken.maskedPhone,
      },
    };
  }

  let currentStatus: StkStatusValue = record?.status ?? 'pending';

  const remoteStatus = await queryUpesipayTransactionStatus(
    config.authHeader,
    checkoutRequestId,
    verifiedToken.transactionId,
    verifiedToken.merchantRequestId,
    verifiedToken.amount
  );

  if (remoteStatus && remoteStatus !== 'sent') {
    currentStatus = remoteStatus;
    if (record) {
      record.status = remoteStatus;
      record.updatedAt = now;
    }
  }

  // Enforce server-side STK Push timeout window if still unconfirmed past 65s
  if (
    (currentStatus === 'sent' || currentStatus === 'pending') &&
    now - verifiedToken.iat >= STK_TIMEOUT_MS
  ) {
    currentStatus = 'timeout';
    if (record) {
      record.status = 'timeout';
      record.updatedAt = now;
    }
  }

  return {
    httpStatus: 200,
    body: {
      success: true,
      status: currentStatus,
      amount: verifiedToken.amount,
      maskedPhone: verifiedToken.maskedPhone,
    },
  };
}

export function handleStkCallback(
  tokenFromQuery: string,
  payload: unknown
): ServiceResult<Record<string, unknown>> {
  const config = getUpesipayConfig();
  if (!config || !tokenFromQuery || !constantTimeMatch(tokenFromQuery, config.callbackSecret)) {
    return {
      httpStatus: 401,
      body: { success: false, message: 'Unauthorized callback.' },
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Invalid callback payload.' },
    };
  }

  const data = payload as {
    checkout_request_id?: unknown;
    reference_id?: unknown;
    status?: unknown;
  };

  const ref =
    typeof data.checkout_request_id === 'string'
      ? data.checkout_request_id
      : typeof data.reference_id === 'string'
        ? data.reference_id
        : '';

  if (!ref) {
    return {
      httpStatus: 400,
      body: { success: false, message: 'Missing transaction reference.' },
    };
  }

  const record = transactionsByCheckoutId.get(ref);
  if (record) {
    if (record.status === 'sent' || record.status === 'pending') {
      record.status = mapExternalStatus(data.status);
      record.updatedAt = Date.now();
    }
  }

  return {
    httpStatus: 200,
    body: { received: true },
  };
}
