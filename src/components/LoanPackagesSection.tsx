import { ArrowUpRight } from 'lucide-react';
import {
  LOAN_PACKAGES,
  LoanPackage,
  formatKsh,
} from '../data/loanPackages';

interface LoanPackagesSectionProps {
  selectedPackageId: string;
  isLoyalMember: boolean;
  onLoyalToggle: (isLoyal: boolean) => void;
  onSelectPackage: (pkg: LoanPackage) => void;
}

export function LoanPackagesSection({
  selectedPackageId,
  isLoyalMember,
  onLoyalToggle,
  onSelectPackage,
}: LoanPackagesSectionProps) {
  return (
    <section id="packages" className="bg-white border-b border-[#E5E0EC] py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header + Loyal Rate Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#521878] mb-2">
              01. Favorable Loan Packages
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1424]"
              style={{ textWrap: 'balance' }}
            >
              Transparent credit tiers built for fair repayment
            </h2>
            <p className="text-sm sm:text-base text-[#5C5268] mt-3 leading-relaxed">
              Every Zenka package features capped facilitation fees, zero hidden rollover penalties, and direct settlement to your M-Pesa wallet.
            </p>
          </div>

          {/* Interactive Rate Mode Switcher */}
          <div
            role="group"
            aria-label="Fee schedule tier"
            className="inline-flex items-center p-1 bg-[#FAF9FC] border border-[#E5E0EC] rounded-xl self-start md:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => onLoyalToggle(false)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                !isLoyalMember
                  ? 'bg-white text-[#1C1424] shadow-xs'
                  : 'text-[#5C5268] hover:text-[#1C1424]'
              }`}
            >
              Standard Rate
            </button>
            <button
              type="button"
              onClick={() => onLoyalToggle(true)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isLoyalMember
                  ? 'bg-[#521878] text-white'
                  : 'text-[#5C5268] hover:text-[#1C1424]'
              }`}
            >
              Loyal Member (-0.4%)
            </button>
          </div>
        </div>

        {/* 4 Package Cards — Styled in Zenka's Brand Palette */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {LOAN_PACKAGES.map((pkg) => {
            const active = selectedPackageId === pkg.id;
            const feeRate = isLoyalMember ? pkg.loyalFeePercent : pkg.baseFeePercent;
            const sampleFee = Math.round((pkg.examplePrincipal * feeRate) / 100);
            const sampleTotal = pkg.examplePrincipal + sampleFee;

            const isPurpleCard = pkg.id === 'growth-plus';
            const isObsidianCard = pkg.id === 'zenka-prime';
            const isGoldAccentCard = pkg.id === 'biashara-pro';
            const isDarkSurface = isPurpleCard || isObsidianCard;

            const cardSurfaceClass = isPurpleCard
              ? 'bg-[#521878] text-white border-[#521878]'
              : isObsidianCard
                ? 'bg-[#141212] text-white border-[#2E2633]'
                : isGoldAccentCard
                  ? 'bg-[#FAF9FC] text-[#1C1424] border-[#DCD3E6]'
                  : 'bg-white text-[#1C1424] border-[#E5E0EC]';

            const activeRingClass = active
              ? isDarkSurface
                ? 'ring-2 ring-[#FFD200] ring-offset-2 ring-offset-white'
                : 'ring-2 ring-[#521878] ring-offset-2 ring-offset-white'
              : '';

            const mutedTextClass = isDarkSurface
              ? 'text-white/75'
              : 'text-[#5C5268]';

            const kickerAccentClass = isDarkSurface
              ? 'text-[#FFD200]'
              : 'text-[#521878]';

            const dividerClass = isDarkSurface
              ? 'border-white/15'
              : 'border-[#E5E0EC]';

            const rateTextClass = isDarkSurface
              ? 'text-[#FFD200]'
              : 'text-[#521878]';

            return (
              <article
                key={pkg.id}
                className={`relative rounded-2xl border overflow-hidden p-6 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 ${cardSurfaceClass} ${activeRingClass}`}
              >
                {/* Signature Zenka ambient glow / geometric circle motif */}
                {isPurpleCard && (
                  <div
                    aria-hidden="true"
                    className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-[#FFD200]/15 pointer-events-none"
                  />
                )}
                {isObsidianCard && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 88% 12%, rgba(143, 88, 18, 0.45) 0%, rgba(20, 18, 18, 0) 60%)',
                    }}
                  />
                )}
                {isGoldAccentCard && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-1 bg-[#FFD200] pointer-events-none"
                  />
                )}
                {!isDarkSurface && !isGoldAccentCard && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-1 bg-[#521878] pointer-events-none"
                  />
                )}

                <div className="relative z-10">
                  {/* Quiet 1-line kicker text instead of pill badges */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <span className={`font-semibold ${kickerAccentClass}`}>
                      {active
                        ? 'Active in calculator'
                        : pkg.recommended
                          ? 'Most Selected'
                          : `${pkg.gracePeriodDays}-day grace`}
                    </span>
                    <span className={mutedTextClass} aria-hidden="true">
                      ·
                    </span>
                    <span className={`tabular-nums ${mutedTextClass}`}>
                      {pkg.supportedTerms.join(' / ')} days
                    </span>
                  </div>

                  <h3
                    className={`font-display text-xl font-bold ${
                      isDarkSurface ? 'text-white' : 'text-[#1C1424]'
                    }`}
                  >
                    {pkg.name}
                  </h3>
                  <p className={`text-xs mt-1 min-h-[2.25rem] ${mutedTextClass}`}>
                    {pkg.audience}
                  </p>

                  {/* Primary Metric Block */}
                  <div className={`my-5 py-4 border-y ${dividerClass}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-xs ${mutedTextClass}`}>
                        Limit range
                      </span>
                      <span
                        className={`font-display text-base font-bold tabular-nums ${
                          isDarkSurface ? 'text-white' : 'text-[#1C1424]'
                        }`}
                      >
                        {formatKsh(pkg.minAmount)} – {formatKsh(pkg.maxAmount)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 mt-2">
                      <span className={`text-xs ${mutedTextClass}`}>
                        Service fee
                      </span>
                      <span
                        className={`font-display text-2xl font-bold tabular-nums ${rateTextClass}`}
                      >
                        {feeRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Concrete Example */}
                  <div className="space-y-1.5 text-xs mb-6">
                    <p className={`leading-relaxed mb-3 ${mutedTextClass}`}>
                      {pkg.summary}
                    </p>
                    <div className={`flex items-center justify-between ${mutedTextClass}`}>
                      <span>Sample borrow</span>
                      <span
                        className={`font-medium tabular-nums ${
                          isDarkSurface ? 'text-white' : 'text-[#1C1424]'
                        }`}
                      >
                        {formatKsh(pkg.examplePrincipal)}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between ${mutedTextClass}`}>
                      <span>Favorable fee</span>
                      <span className={`font-semibold tabular-nums ${rateTextClass}`}>
                        {formatKsh(sampleFee)}
                      </span>
                    </div>
                    <div
                      className={`flex items-center justify-between font-semibold pt-1.5 border-t ${dividerClass} ${
                        isDarkSurface ? 'text-white' : 'text-[#1C1424]'
                      }`}
                    >
                      <span>Sample total</span>
                      <span className="tabular-nums">{formatKsh(sampleTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className={`relative z-10 w-full py-3 px-4 rounded-full text-xs font-bold tracking-wide inline-flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isDarkSurface
                      ? 'bg-[#FFD200] hover:bg-[#F2C400] text-[#141212] focus-visible:outline-[#FFD200]'
                      : isGoldAccentCard
                        ? 'bg-[#FFD200] hover:bg-[#F2C400] text-[#141212] focus-visible:outline-[#521878]'
                        : 'bg-[#521878] hover:bg-[#3B0F58] text-white focus-visible:outline-[#521878]'
                  }`}
                >
                  Select {pkg.name}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </article>
            );
          })}
        </div>

        {/* Transparent Fee Comparison Matrix */}
        <div className="mt-12 bg-[#FAF9FC] border border-[#E5E0EC] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E0EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1C1424]">
                Package Fee Comparison Matrix
              </h3>
              <p className="text-xs text-[#5C5268]">
                Showing {isLoyalMember ? 'Loyal Member discounted rates' : 'Standard first-time borrower rates'} with zero hidden administration fees.
              </p>
            </div>
            <span className="text-xs font-medium text-[#521878]">
              Currency: Kenyan Shilling (KSh)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5E0EC] text-xs font-semibold text-[#5C5268] bg-white">
                  <th className="py-3.5 px-6">Package</th>
                  <th className="py-3.5 px-4">Tenor</th>
                  <th className="py-3.5 px-4 text-right">Sample Principal</th>
                  <th className="py-3.5 px-4 text-right">Fee Rate</th>
                  <th className="py-3.5 px-4 text-right">Fee Amount</th>
                  <th className="py-3.5 px-4 text-right">Total Repayment</th>
                  <th className="py-3.5 px-6 text-right">Grace Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0EC]">
                {LOAN_PACKAGES.map((pkg) => {
                  const rate = isLoyalMember ? pkg.loyalFeePercent : pkg.baseFeePercent;
                  const fee = Math.round((pkg.examplePrincipal * rate) / 100);
                  const total = pkg.examplePrincipal + fee;
                  return (
                    <tr
                      key={pkg.id}
                      className="hover:bg-white transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-[#1C1424]">
                        {pkg.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#5C5268] tabular-nums">
                        {pkg.supportedTerms.join(', ')} days
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#1C1424] tabular-nums">
                        {formatKsh(pkg.examplePrincipal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#521878] tabular-nums">
                        {rate.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#1C1424] tabular-nums">
                        {formatKsh(fee)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1C1424] tabular-nums">
                        {formatKsh(total)}
                      </td>
                      <td className="py-3.5 px-6 text-right text-[#5C5268] tabular-nums">
                        {pkg.gracePeriodDays} days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
