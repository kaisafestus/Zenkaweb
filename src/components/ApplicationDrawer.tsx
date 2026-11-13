import { useState, useEffect, FormEvent } from 'react';
import { X, CheckCircle2, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react';
import {
  ExtensionOption,
  LoanCalculation,
  formatKsh,
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

function isValidKenyanPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s-]/g, '');
  return /^(\+?254|0)(7|1)\d{8}$/.test(cleaned);
}

function normalizeKenyanPhone(raw: string): string {
  const cleaned = raw.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+254')) return cleaned;
  if (cleaned.startsWith('254')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+254${cleaned.slice(1)}`;
  return cleaned;
}

export function ApplicationDrawer({ intent, onClose }: ApplicationDrawerProps) {
  const [step, setStep] = useState<'details' | 'checkout' | 'confirmed'>('details');
  const [fullName, setFullName] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [purpose, setPurpose] = useState('Working Capital / Biashara');
  const [errorMsg, setErrorMsg] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  useEffect(() => {
    if (intent) {
      setStep('details');
      setErrorMsg('');
    }
  }, [intent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && intent) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [intent, onClose]);

  if (!intent) return null;

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!isValidKenyanPhone(mpesaNumber)) {
      setErrorMsg('Enter a valid Kenyan M-Pesa number (e.g. 0712 345 678 or +254 712 345 678).');
      return;
    }
    if (intent.type === 'loan' && !/^\d{6,10}$/.test(nationalId.trim())) {
      setErrorMsg('Enter a valid Kenyan National ID (6–10 digits).');
      return;
    }

    setStep('checkout');
  };

  const handleConfirmRequest = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setReferenceCode(`ZNK-${randomSuffix}`);
    setStep('confirmed');
  };

  const titleByType =
    intent.type === 'loan'
      ? 'Loan Application & M-Pesa Disbursement'
      : intent.type === 'extension'
        ? 'Loan Extension Checkout'
        : 'M-Pesa Bonus Withdrawal';

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
        {/* Top Drawer Header */}
        <div>
          <div className="px-6 py-5 border-b border-[#E5E0EC] flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <ZenkaLogo showWordmark={false} />
              <div>
                <h2 className="font-display text-lg font-bold text-[#1C1424]">
                  {titleByType}
                </h2>
                <p className="text-xs text-[#5C5268]">
                  {step === 'details'
                    ? 'Step 1 of 2 · Account & M-Pesa details'
                    : step === 'checkout'
                      ? 'Step 2 of 2 · Review & M-Pesa checkout'
                      : 'Request recorded'}
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
            {/* Summary Strip matching active intent */}
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
                    <span className="text-[#5C5268]">Borrow principal</span>
                    <span className="font-bold text-[#1C1424] tabular-nums">
                      {formatKsh(intent.calculation.amount, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C5268]">
                      Favorable fee ({intent.calculation.effectiveFeePercent}%)
                    </span>
                    <span className="font-semibold text-[#1C1424] tabular-nums">
                      {formatKsh(intent.calculation.feeAmount, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E0EC]">
                    <span className="font-semibold text-[#1C1424]">
                      Total due on {intent.calculation.dueDateFormatted}
                    </span>
                    <span className="font-display text-lg font-bold text-[#521878] tabular-nums">
                      {formatKsh(intent.calculation.totalRepayment, true)}
                    </span>
                  </div>
                </>
              )}

              {intent.type === 'extension' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C5268]">Current loan balance</span>
                    <span className="font-semibold text-[#1C1424] tabular-nums">
                      {formatKsh(intent.balance, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5C5268]">Extension period</span>
                    <span className="font-semibold text-[#521878]">
                      +{intent.option.days} Days ({intent.option.feePercent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E0EC]">
                    <span className="font-semibold text-[#1C1424]">
                      Extension fee payable via M-Pesa
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
                    <span className="text-[#5C5268]">Qualified invitations</span>
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

            {/* Step 1: Borrower Details Form */}
            {step === 'details' && (
              <form id="zenka-drawer-form" onSubmit={handleDetailsSubmit} className="space-y-4">
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
                        Primary Loan Purpose
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

            {/* Step 2: M-Pesa Checkout & STK Push Integration Slot */}
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
                    <span className="text-[#5C5268]">M-Pesa account</span>
                    <span className="font-mono text-xs font-semibold text-[#1C1424]">
                      {normalizeKenyanPhone(mpesaNumber)}
                    </span>
                  </div>
                  {intent.type === 'loan' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C5268]">Purpose</span>
                      <span className="font-medium text-[#1C1424]">{purpose}</span>
                    </div>
                  )}
                </div>

                {/* Explicit M-Pesa STK Push Readiness Card */}
                <div className="rounded-xl bg-[#FAF9FC] border border-[#521878]/25 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#521878]">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>
                      {intent.type === 'extension'
                        ? 'M-Pesa Express (STK Push) Checkout Slot'
                        : 'Direct M-Pesa Settlement Channel'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5268] leading-relaxed">
                    {intent.type === 'extension'
                      ? 'This checkout view is wired for Safaricom Daraja STK Push integration. Confirming below validates the extension summary so live M-Pesa PIN prompts can be connected next.'
                      : 'Disbursement target and repayment prompts are structured for Safaricom M-Pesa Express (STK Push) checkout in the next integration phase.'}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#5C5268]">
                  <ShieldCheck className="w-4 h-4 text-[#521878] shrink-0 mt-0.5" />
                  <span>
                    By confirming, you agree to Zenka&apos;s transparent fee terms and confirm that {normalizeKenyanPhone(mpesaNumber)} belongs to you.
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation Receipt */}
            {step === 'confirmed' && (
              <div className="rounded-2xl border border-[#E5E0EC] p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD200] text-[#521878] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#1C1424]">
                    {intent.type === 'loan'
                      ? 'Loan Application Submitted'
                      : intent.type === 'extension'
                        ? 'Extension Checkout Queued'
                        : 'Bonus Withdrawal Queued'}
                  </h3>
                  <p className="text-xs text-[#5C5268] mt-1">
                    Reference ID:{' '}
                    <span className="font-mono font-semibold text-[#521878]">
                      {referenceCode}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-[#5C5268] leading-relaxed">
                  Your summary for{' '}
                  <span className="font-semibold text-[#1C1424]">
                    {normalizeKenyanPhone(mpesaNumber)}
                  </span>{' '}
                  has been prepared cleanly. Live M-Pesa STK Push payment prompts can be attached directly to this checkout confirmation handler.
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
                Continue to Checkout
              </button>
            </>
          )}

          {step === 'checkout' && (
            <>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-[#E5E0EC] text-xs font-semibold text-[#5C5268] hover:text-[#1C1424] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                className="flex-1 py-3 px-6 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                {intent.type === 'extension'
                  ? 'Confirm Extension Summary'
                  : 'Submit Application'}
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
