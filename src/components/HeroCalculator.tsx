import { ArrowRight } from 'lucide-react';
import {
  LoanCalculation,
  LoanTermDays,
  formatKsh,
} from '../data/loanPackages';
import { ZenkaLogo } from './ZenkaLogo';

interface HeroCalculatorProps {
  amount: number;
  termDays: LoanTermDays;
  isLoyalMember: boolean;
  calculation: LoanCalculation;
  onAmountChange: (amount: number) => void;
  onTermChange: (term: LoanTermDays) => void;
  onLoyalToggle: (isLoyal: boolean) => void;
  onApply: () => void;
}

const TERM_OPTIONS: LoanTermDays[] = [14, 30, 61];
const QUICK_AMOUNTS = [5000, 20000, 50000, 120000, 200000];

export function HeroCalculator({
  amount,
  termDays,
  isLoyalMember,
  calculation,
  onAmountChange,
  onTermChange,
  onLoyalToggle,
  onApply,
}: HeroCalculatorProps) {
  const sliderPercent = ((amount - 500) / (200000 - 500)) * 100;

  return (
    <section
      id="calculator"
      className="bg-[#FAF9FC] border-b border-[#E5E0EC]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Zenka Brand Editorial Proposition */}
          <div className="lg:col-span-6 relative rounded-2xl bg-[#141212] text-white overflow-hidden p-8 sm:p-10 flex flex-col justify-between min-h-[460px]">
            {/* Warm bronze ambient lighting inspired by Zenka campaign visuals */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 85% 20%, rgba(143, 88, 18, 0.55) 0%, rgba(20, 18, 18, 0.95) 62%)',
              }}
            />
            {/* Signature Zenka overlapping Purple & Gold geometric circles */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#521878] opacity-95 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-[#FFD200] opacity-95 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="hidden sm:flex absolute bottom-7 right-7 flex-col items-end text-right pointer-events-none select-none"
            >
              <span className="font-display text-2xl font-extrabold leading-none text-[#521878]">
                61 DAY
              </span>
              <span className="font-display text-lg font-semibold leading-tight text-[#141212]">
                TERMS
              </span>
            </div>

            <div className="relative z-10 max-w-lg">
              <p className="text-xs font-medium tracking-wide text-[#FFD200] mb-4">
                Zenka Web Portal · Direct to M-Pesa · Kenya
              </p>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.08] mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Borrow up to{' '}
                <span className="text-[#FFD200]">KSh 200,000</span> for your
                next big move.
              </h1>

              <p className="text-base text-white/80 leading-relaxed max-w-md mb-8">
                Experience the full Zenka loan platform on the web with transparent,
                favorable facilitation fees starting at 1.8% and flexible repayment
                schedules up to 61 days.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#FFD200] hover:bg-[#F2C400] text-[#141212] text-sm font-bold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD200]"
                >
                  Explore Favorable Packages
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/15 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/75 pr-28">
              <span>No paperwork</span>
              <span aria-hidden="true">·</span>
              <span>Transparent fees</span>
              <span aria-hidden="true">·</span>
              <span>M-Pesa checkout ready</span>
            </div>
          </div>

          {/* Right Column: Interactive Total Cost Calculated Loan Widget */}
          <div className="lg:col-span-6 bg-white border border-[#E5E0EC] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E5E0EC]">
                <div className="flex items-center gap-3">
                  <ZenkaLogo showWordmark={false} />
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#1C1424]">
                      Total cost calculated loan
                    </h2>
                    <p className="text-xs text-[#5C5268]">
                      Matched package: <span className="font-semibold text-[#521878]">{calculation.matchedPackage.name}</span>
                    </p>
                  </div>
                </div>

                {/* Interactive Borrower Tier Segmented Control */}
                <div
                  role="group"
                  aria-label="Borrower rate tier"
                  className="inline-flex items-center p-1 bg-[#FAF9FC] border border-[#E5E0EC] rounded-lg shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onLoyalToggle(false)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      !isLoyalMember
                        ? 'bg-white text-[#1C1424] shadow-xs'
                        : 'text-[#5C5268] hover:text-[#1C1424]'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoyalToggle(true)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isLoyalMember
                        ? 'bg-[#521878] text-white'
                        : 'text-[#5C5268] hover:text-[#1C1424]'
                    }`}
                  >
                    Loyal Rate
                  </button>
                </div>
              </div>

              {/* Amount Input & Range Slider */}
              <div className="pt-6 pb-5">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                  <label
                    htmlFor="loan-amount-input"
                    className="text-sm font-medium text-[#5C5268]"
                  >
                    I would like to borrow
                  </label>
                  <div className="flex items-center border border-[#E5E0EC] rounded-lg px-3 py-1.5 bg-[#FAF9FC] focus-within:border-[#521878] focus-within:ring-2 focus-within:ring-[#521878]/15">
                    <span className="text-xs font-semibold text-[#5C5268] mr-1.5">
                      KSh
                    </span>
                    <input
                      id="loan-amount-input"
                      type="number"
                      min={500}
                      max={200000}
                      step={500}
                      value={amount}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (!Number.isNaN(parsed)) {
                          onAmountChange(Math.min(200000, Math.max(500, parsed)));
                        }
                      }}
                      className="w-24 text-right font-display text-xl font-bold text-[#1C1424] bg-transparent outline-none tabular-nums"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  aria-label="Borrow amount slider"
                  min={500}
                  max={200000}
                  step={500}
                  value={amount}
                  onChange={(e) => onAmountChange(Number(e.target.value))}
                  className="zenka-slider w-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #521878 0%, #521878 ${sliderPercent}%, #E5E0EC ${sliderPercent}%, #E5E0EC 100%)`,
                  }}
                />

                <div className="flex items-center justify-between text-xs text-[#5C5268] tabular-nums mt-2">
                  <span>KSh 500</span>
                  <span>KSh 200,000</span>
                </div>

                {/* Quick preset buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {QUICK_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onAmountChange(preset)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors tabular-nums whitespace-nowrap cursor-pointer ${
                        amount === preset
                          ? 'bg-[#521878] border-[#521878] text-white'
                          : 'bg-white border-[#E5E0EC] text-[#5C5268] hover:border-[#521878]/50 hover:text-[#1C1424]'
                      }`}
                    >
                      {formatKsh(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repayment Term Selector */}
              <div className="py-4 border-t border-[#E5E0EC]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-medium text-[#5C5268]">
                    Repayment duration
                  </span>
                  <span className="text-xs text-[#5C5268] tabular-nums">
                    Due {calculation.dueDateFormatted}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {TERM_OPTIONS.map((days) => {
                    const active = termDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => onTermChange(days)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#521878] border-[#521878] text-white font-semibold'
                            : 'bg-[#FAF9FC] border-[#E5E0EC] text-[#1C1424] hover:border-[#521878]/50 font-medium'
                        }`}
                      >
                        <span className="text-sm tabular-nums">
                          For {days} days
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clean Hairline Breakdown Rows */}
              <dl className="py-4 border-t border-[#E5E0EC] space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#5C5268]">Principal amount</dt>
                  <dd className="font-semibold text-[#1C1424] tabular-nums">
                    {formatKsh(calculation.amount, true)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#5C5268]">
                    Favorable service fee ({calculation.effectiveFeePercent}%)
                  </dt>
                  <dd className="font-semibold text-[#521878] tabular-nums">
                    + {formatKsh(calculation.feeAmount, true)}
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E0EC]">
                  <dt className="font-semibold text-[#1C1424]">
                    Total repayment
                  </dt>
                  <dd className="font-display text-2xl font-bold text-[#1C1424] tabular-nums">
                    {formatKsh(calculation.totalRepayment, true)}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={onApply}
              className="mt-4 w-full py-3.5 px-6 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold tracking-wide transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#521878]"
            >
              APPLY NOW
            </button>
          </div>
        </div>

        {/* Full-Width 4-Column Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white border border-[#E5E0EC] rounded-xl p-5">
            <p className="text-xs text-[#5C5268] mb-1">Loan Limits</p>
            <p className="font-display text-xl font-bold text-[#1C1424] tabular-nums">
              KSh 500 – 200,000
            </p>
          </div>
          <div className="bg-white border border-[#E5E0EC] rounded-xl p-5">
            <p className="text-xs text-[#5C5268] mb-1">Flexible Tenors</p>
            <p className="font-display text-xl font-bold text-[#1C1424] tabular-nums">
              14 to 61 Days
            </p>
          </div>
          <div className="bg-white border border-[#E5E0EC] rounded-xl p-5">
            <p className="text-xs text-[#5C5268] mb-1">Favorable Service Fee</p>
            <p className="font-display text-xl font-bold text-[#521878] tabular-nums">
              1.8% – 3.0%
            </p>
          </div>
          <div className="bg-white border border-[#E5E0EC] rounded-xl p-5">
            <p className="text-xs text-[#5C5268] mb-1">Disbursement Channel</p>
            <p className="font-display text-xl font-bold text-[#1C1424]">
              Direct to M-Pesa
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
