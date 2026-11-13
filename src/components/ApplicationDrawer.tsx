import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  X,
  CheckCircle2,
  Smartphone,
  ArrowLeft,
  Loader2,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ExtensionOption,
  LoanCalculation,
  formatKsh,
  normalizeMpesaPhone254,
} from '../data/loanPackages';
import { ZenkaLogo } from './ZenkaLogo';

export type CheckoutIntent =
  | { type: 'loan'; calculation: LoanCalculation }
  | {
      type: 'extension';
      balance: number;
      option: ExtensionOption;
      extensionFee: number;
    }
  | { type: 'referral'; bonusAmount: number; friendCount: number };

interface ApplicationDrawerProps {
  intent: CheckoutIntent | null;
  onClose: () => void;
}

type DrawerStep =
  | 'details'
  | 'checkout'
  | 'awaiting_pin'
  | 'confirmed'
  | 'cancelled'
  | 'timeout';

const STK_TIMEOUT_SECONDS = 65;

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `znk-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function ApplicationDrawer({ intent, onClose }: ApplicationDrawerProps) {
  const [step, setStep] = useState<DrawerStep>('details');
  const [fullName, setFullName] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [purpose, setPurpose] = useState('Working Capital / Biashara');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(STK_TIMEOUT_SECONDS);

  const pollTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const stopTimers = () => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (intent) {
      stopTimers();
      setStep('details');
      setErrorMsg('');
      setSubmitting(false);
      setIdempotencyKey(createIdempotencyKey());
      setCheckoutRequestId('');
      setSessionToken('');
      setMaskedPhone('');
      setSecondsRemaining(STK_TIMEOUT_SECONDS);
    }
    return () => stopTimers();
  }, [intent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && intent) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [intent, onClose]);

  const verifyStatusServerSide = async (
    reqId: string,
    token: string
  ): Promise<'sent' | 'pending' | 'success' | 'cancelled' | 'timeout'> => {
    setCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/stk/status?checkoutRequestId=${encodeURIComponent(reqId)}`,
        {
          method: 'GET',
          headers: {
            'X-Session-Token': token,
          },
        }
      );
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        status?: 'sent' | 'pending' | 'success' | 'cancelled' | 'timeout';
        amount?: number;
        maskedPhone?: string;
      } | null;

      if (!res.ok || !data?.success || !data.status) {
        return 'pending';
      }

      if (typeof data.amount === 'number') setConfirmedAmount(data.amount);
      if (data.maskedPhone) setMaskedPhone(data.maskedPhone);

      if (data.status === 'success') {
        stopTimers();
        setStep('confirmed');
      } else if (data.status === 'cancelled') {
        stopTimers();
        setStep('cancelled');
      } else if (data.status === 'timeout') {
        stopTimers();
        setStep('timeout');
      }
      return data.status;
    } catch {
      return 'pending';
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (step !== 'awaiting_pin' || !checkoutRequestId || !sessionToken) {
      return;
    }

    setSecondsRemaining(STK_TIMEOUT_SECONDS);

    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopTimers();
          void verifyStatusServerSide(checkoutRequestId, sessionToken).then((status) => {
            if (status !== 'success' && status !== 'cancelled') {
              setStep('timeout');
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollTimerRef.current = window.setInterval(async () => {
      await verifyStatusServerSide(checkoutRequestId, sessionToken);
    }, 3000);

    return () => stopTimers();
  }, [step, checkoutRequestId, sessionToken]);

  if (!intent) return null;

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!normalizeMpesaPhone254(mpesaNumber)) {
      setErrorMsg(
        'Enter a valid Kenyan M-Pesa number (e.g. 0712 345 678 or +254 712 345 678).'
      );
      return;
    }
    if (intent.type === 'loan' && !/^\d{6,10}$/.test(nationalId.trim())) {
      setErrorMsg('Enter a valid Kenyan National ID (6–10 digits).');
      return;
    }

    setStep('checkout');
  };

  const handleInitiateStkPush = async () => {
    if (intent.type === 'referral') {
      setConfirmedAmount(intent.bonusAmount);
      setMaskedPhone(normalizeMpesaPhone254(mpesaNumber) ?? mpesaNumber);
      setStep('confirmed');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    const requestBody =
      intent.type === 'loan'
        ? {
            intentType: 'loan_fee',
            tierPrincipal: intent.calculation.amount,
            phoneNumber: mpesaNumber,
            fullName: fullName.trim(),
            nationalId: nationalId.trim(),
            idempotencyKey,
          }
        : {
            intentType: 'extension_fee',
            tierPrincipal: intent.balance,
            extensionDays: intent.option.days,
            phoneNumber: mpesaNumber,
            fullName: fullName.trim(),
            idempotencyKey,
          };

    try {
      const res = await fetch('/api/stk/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        checkoutRequestId?: string;
        sessionToken?: string;
        amount?: number;
        maskedPhone?: string;
        message?: string;
      } | null;

      if (!res.ok || !data?.success || !data.checkoutRequestId || !data.sessionToken) {
        setErrorMsg(
          data?.message ??
            'Unable to initiate M-Pesa payment right now. Please try again.'
        );
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setSessionToken(data.sessionToken);
      setConfirmedAmount(data.amount ?? 0);
      setMaskedPhone(data.maskedPhone ?? '');
      setStep('awaiting_pin');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryStk = () => {
    stopTimers();
    setIdempotencyKey(createIdempotencyKey());
    setErrorMsg('');
    setStep('checkout');
  };

  const titleByType =
    intent.type === 'loan'
      ? 'Apply for Loan'
      : intent.type === 'extension'
        ? 'Loan Extension Payment'
        : 'M-Pesa Bonus Withdrawal';

  const normalizedPhoneDisplay =
    normalizeMpesaPhone254(mpesaNumber) ?? mpesaNumber;

  const stkPayableAmount =
    intent.type === 'loan'
      ? intent.calculation.feeAmount
      : intent.type === 'extension'
        ? intent.extensionFee
        : intent.bonusAmount;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#141212]/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={titleByType}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto border-l border-[#E5E0EC] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Top Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E5E0EC] flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <ZenkaLogo showWordmark={false} />
              <div>
                <h2 className="font-display text-lg font-bold text-[#1C1424]">
                  {titleByType}
                </h2>
                <p className="text-xs text-[#5C5268]">
                  {step === 'details'
                    ? 'Enter your details'
                    : step === 'checkout'
                      ? 'Confirm & pay fee'
                      : step === 'awaiting_pin'
                        ? 'Waiting for M-Pesa PIN'
                        : step === 'confirmed'
                          ? 'Completed'
                          : step === 'cancelled'
                            ? 'Cancelled'
                            : 'Timed out'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-9 h-9 rounded-full border border-[#E5E0EC] flex items-center justify-center text-[#5C5268] hover:text-[#1C1424] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Compact Package Summary */}
            {(step === 'details' || step === 'checkout') && (
              <div className="rounded-xl bg-[#FAF9FC] border border-[#E5E0EC] p-4 space-y-2 text-sm">
                {intent.type === 'loan' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Package</span>
                      <span className="font-semibold text-[#521878]">
                        {intent.calculation.matchedPackage.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Loan amount</span>
                      <span className="font-bold text-[#1C1424] tabular-nums">
                        {formatKsh(intent.calculation.amount, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">
                        Due on {intent.calculation.dueDateFormatted}
                      </span>
                      <span className="font-semibold text-[#1C1424] tabular-nums">
                        {formatKsh(intent.calculation.totalRepayment, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E0EC]">
                      <span className="font-semibold text-[#1C1424]">
                        Application fee
                      </span>
                      <span className="font-display text-lg font-bold text-[#521878] tabular-nums">
                        {formatKsh(intent.calculation.feeAmount, true)}
                      </span>
                    </div>
                  </>
                )}

                {intent.type === 'extension' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Active loan</span>
                      <span className="font-semibold text-[#1C1424] tabular-nums">
                        {formatKsh(intent.balance, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Extension period</span>
                      <span className="font-semibold text-[#521878]">
                        +{intent.option.days} Days
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E0EC]">
                      <span className="font-semibold text-[#1C1424]">
                        Extension fee
                      </span>
                      <span className="font-display text-lg font-bold text-[#521878] tabular-nums">
                        {formatKsh(intent.extensionFee, true)}
                      </span>
                    </div>
                  </>
                )}

                {intent.type === 'referral' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Invitations</span>
                      <span className="font-semibold text-[#1C1424] tabular-nums">
                        {intent.friendCount} friends × KSh 100
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E0EC]">
                      <span className="font-semibold text-[#1C1424]">
                        Payout to M-Pesa
                      </span>
                      <span className="font-display text-lg font-bold text-[#521878] tabular-nums">
                        {formatKsh(intent.bonusAmount, true)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 1: Enter Details */}
            {step === 'details' && (
              <form
                id="zenka-drawer-form"
                onSubmit={handleDetailsSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="drawer-full-name"
                    className="block text-xs font-semibold text-[#1C1424] mb-1.5"
                  >
                    Full Legal Name (as on National ID)
                  </label>
                  <input
                    id="drawer-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Wanjiku Kamau"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0EC] bg-white text-sm text-[#1C1424] focus:border-[#521878] focus:ring-2 focus:ring-[#521878]/15 outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="drawer-mpesa-phone"
                    className="block text-xs font-semibold text-[#1C1424] mb-1.5"
                  >
                    Safaricom M-Pesa Number
                  </label>
                  <input
                    id="drawer-mpesa-phone"
                    type="tel"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0EC] bg-white text-sm text-[#1C1424] tabular-nums focus:border-[#521878] focus:ring-2 focus:ring-[#521878]/15 outline-none"
                    required
                  />
                </div>

                {intent.type === 'loan' && (
                  <>
                    <div>
                      <label
                        htmlFor="drawer-national-id"
                        className="block text-xs font-semibold text-[#1C1424] mb-1.5"
                      >
                        National ID Number
                      </label>
                      <input
                        id="drawer-national-id"
                        type="text"
                        inputMode="numeric"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="e.g. 34567890"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0EC] bg-white text-sm text-[#1C1424] tabular-nums focus:border-[#521878] focus:ring-2 focus:ring-[#521878]/15 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="drawer-loan-purpose"
                        className="block text-xs font-semibold text-[#1C1424] mb-1.5"
                      >
                        Loan Purpose
                      </label>
                      <select
                        id="drawer-loan-purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0EC] bg-white text-sm text-[#1C1424] focus:border-[#521878] focus:ring-2 focus:ring-[#521878]/15 outline-none"
                      >
                        <option value="Working Capital / Biashara">
                          Working Capital / Biashara
                        </option>
                        <option value="Personal & Household">
                          Personal &amp; Household
                        </option>
                        <option value="Education & School Fees">
                          Education &amp; School Fees
                        </option>
                        <option value="Medical & Emergency">
                          Medical &amp; Emergency
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5"
                  >
                    {errorMsg}
                  </p>
                )}
              </form>
            )}

            {/* Step 2: Confirm & Pay Fee */}
            {step === 'checkout' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E5E0EC] p-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C5268]">Applicant</span>
                    <span className="font-semibold text-[#1C1424]">
                      {fullName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C5268]">M-Pesa number</span>
                    <span className="font-mono text-xs font-semibold text-[#1C1424]">
                      {normalizedPhoneDisplay}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAF9FC] border border-[#E5E0EC] p-4 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-[#521878] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#5C5268] leading-relaxed">
                    {intent.type === 'referral'
                      ? 'Confirm below to withdraw your bonus directly to your M-Pesa number.'
                      : `Tap below to receive an M-Pesa payment prompt of ${formatKsh(stkPayableAmount)} on your phone. Keep your screen unlocked to enter your PIN.`}
                  </p>
                </div>

                {errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5"
                  >
                    {errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Simple STK Push Sent Card */}
            {step === 'awaiting_pin' && (
              <div className="rounded-2xl border border-[#E5E0EC] bg-white p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#521878] text-[#FFD200] flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#1C1424]">
                  STK Push Sent
                </h3>
                <p className="text-sm text-[#5C5268] leading-relaxed">
                  An STK push has been sent to{' '}
                  <span className="font-semibold text-[#1C1424] tabular-nums">
                    {maskedPhone || normalizedPhoneDisplay}
                  </span>
                  . Enter your M-Pesa PIN to complete the transaction of{' '}
                  <span className="font-bold text-[#521878] tabular-nums">
                    {formatKsh(confirmedAmount || stkPayableAmount)}
                  </span>
                  .
                </p>

                <p className="text-xs font-medium text-[#5C5268] tabular-nums">
                  Verifying payment... {secondsRemaining}s remaining
                </p>

                <button
                  type="button"
                  disabled={checkingStatus}
                  onClick={() =>
                    void verifyStatusServerSide(checkoutRequestId, sessionToken)
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#521878] text-xs font-semibold text-[#521878] hover:bg-[#521878] hover:text-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`}
                  />
                  {checkingStatus ? 'Verifying...' : 'Verify Payment'}
                </button>
              </div>
            )}

            {/* Step 4a: Simple Success Card */}
            {step === 'confirmed' && (
              <div className="rounded-2xl border border-[#E5E0EC] bg-white p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FFD200] text-[#521878] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#1C1424]">
                  {intent.type === 'referral'
                    ? 'Withdrawal Queued'
                    : 'Transaction Successful'}
                </h3>
                <p className="text-sm text-[#5C5268] leading-relaxed">
                  {intent.type === 'referral'
                    ? `Your M-Pesa bonus payout of ${formatKsh(confirmedAmount)} has been queued.`
                    : `Your payment of ${formatKsh(confirmedAmount || stkPayableAmount)} from ${maskedPhone || normalizedPhoneDisplay} has been verified and confirmed.`}
                </p>
              </div>
            )}

            {/* Step 4b: Simple Transaction Cancelled Card */}
            {step === 'cancelled' && (
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white border border-[#FECACA] text-[#DC2626] flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#1C1424]">
                  Transaction Cancelled
                </h3>
                <p className="text-sm text-[#5C5268] leading-relaxed">
                  The M-Pesa transaction was cancelled. No amount was deducted from your account.
                </p>
              </div>
            )}

            {/* Step 4c: Simple Transaction Timed Out Card */}
            {step === 'timeout' && (
              <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white border border-[#FDE68A] text-[#D97706] flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#1C1424]">
                  Transaction Timed Out
                </h3>
                <p className="text-sm text-[#5C5268] leading-relaxed">
                  We did not receive your M-Pesa PIN confirmation in time. Please try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-[#E5E0EC] bg-white sticky bottom-0 flex items-center justify-between gap-3">
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-full border border-[#E5E0EC] text-xs font-semibold text-[#5C5268] hover:text-[#1C1424] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="zenka-drawer-form"
                className="flex-1 py-3 px-6 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Continue
              </button>
            </>
          )}

          {step === 'checkout' && (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep('details')}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-[#E5E0EC] text-xs font-semibold text-[#5C5268] hover:text-[#1C1424] transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleInitiateStkPush}
                className="flex-1 py-3 px-6 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? 'Sending Prompt...'
                  : intent.type === 'referral'
                    ? 'Confirm Withdrawal'
                    : `Pay Fee of ${formatKsh(stkPayableAmount)}`}
              </button>
            </>
          )}

          {step === 'awaiting_pin' && (
            <button
              type="button"
              onClick={handleRetryStk}
              className="w-full py-3 px-6 rounded-full border border-[#E5E0EC] text-xs font-semibold text-[#5C5268] hover:text-[#1C1424] transition-colors cursor-pointer"
            >
              Cancel &amp; Try Different Number
            </button>
          )}

          {(step === 'cancelled' || step === 'timeout') && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-full border border-[#E5E0EC] text-xs font-semibold text-[#5C5268] hover:text-[#1C1424] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRetryStk}
                className="flex-1 py-3 px-6 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </>
          )}

          {step === 'confirmed' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-full bg-[#FFD200] hover:bg-[#F2C400] text-[#141212] text-sm font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
