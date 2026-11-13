import { ArrowUpRight } from 'lucide-react';
import {
  LOAN_PACKAGES,
  LOAN_TIERS,
  LoanPackage,
  LoanTier,
  formatKsh,
  getPackageForTier,
} from '../data/loanPackages';

interface LoanPackagesSectionProps {
  selectedAmount: number;
  selectedPackageId: string;
  onSelectTier: (tier: LoanTier, pkg: LoanPackage) => void;
}

export function LoanPackagesSection({
  selectedAmount,
  selectedPackageId,
  onSelectTier,
}: LoanPackagesSectionProps) {
  return (
    <section
      id="packages"
      className="bg-white border-b border-[#E5E0EC] py-16 lg:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold tracking-wide text-[#521878] mb-2">
            01. Loan Packages &amp; Fixed Fees
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1424]"
            style={{ textWrap: 'balance' }}
          >
            Twelve transparent credit tiers with exact upfront fees
          </h2>
          <p className="text-sm sm:text-base text-[#5C5268] mt-3 leading-relaxed">
            Pick any loan amount from KSh 10,000 to KSh 70,000. Each tier carries a fixed facilitation fee settled cleanly via M-Pesa STK Push.
          </p>
        </div>

        {/* 4 Smart Brand Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {LOAN_PACKAGES.map((pkg) => {
            const isActivePkg = selectedPackageId === pkg.id;
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

            const activeRingClass = isActivePkg
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

            const primaryTier =
              pkg.tiers.find((t) => t.principal === selectedAmount) ??
              pkg.tiers[0];

            return (
              <article
                key={pkg.id}
                className={`relative rounded-2xl border overflow-hidden p-6 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 ${cardSurfaceClass} ${activeRingClass}`}
              >
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
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <span className={`font-semibold ${kickerAccentClass}`}>
                      {isActivePkg
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

                  {/* Interactive 3-Tier Fee Rows inside each Package Card */}
                  <div className={`my-5 py-3 border-y ${dividerClass} space-y-1.5`}>
                    {pkg.tiers.map((tier) => {
                      const isSelectedTier = selectedAmount === tier.principal;
                      return (
                        <button
                          key={tier.principal}
                          type="button"
                          onClick={() => onSelectTier(tier, pkg)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelectedTier
                              ? isDarkSurface
                                ? 'bg-[#FFD200] text-[#141212] font-bold'
                                : 'bg-[#521878] text-white font-bold'
                              : isDarkSurface
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-[#FAF9FC] text-[#1C1424]'
                          }`}
                        >
                          <span className="tabular-nums font-semibold">
                            {formatKsh(tier.principal)}
                          </span>
                          <span
                            className={`tabular-nums font-semibold ${
                              isSelectedTier
                                ? isDarkSurface
                                  ? 'text-[#141212]'
                                  : 'text-[#FFD200]'
                                : isDarkSurface
                                  ? 'text-[#FFD200]'
                                  : 'text-[#521878]'
                            }`}
                          >
                            Fee {formatKsh(tier.fee)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className={`text-xs leading-relaxed mb-6 ${mutedTextClass}`}>
                    {pkg.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTier(primaryTier, pkg)}
                  className={`relative z-10 w-full py-3 px-4 rounded-full text-xs font-bold tracking-wide inline-flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isDarkSurface || isGoldAccentCard
                      ? 'bg-[#FFD200] hover:bg-[#F2C400] text-[#141212] focus-visible:outline-[#FFD200]'
                      : 'bg-[#521878] hover:bg-[#3B0F58] text-white focus-visible:outline-[#521878]'
                  }`}
                >
                  Apply {formatKsh(primaryTier.principal)}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </article>
            );
          })}
        </div>

        {/* Complete 12-Tier Schedule Matrix */}
        <div className="mt-12 bg-[#FAF9FC] border border-[#E5E0EC] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E0EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1C1424]">
                Complete Package &amp; Fee Schedule
              </h3>
              <p className="text-xs text-[#5C5268]">
                Click any tier row to initiate M-Pesa STK Push checkout for its exact facilitation fee.
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
                  <th className="py-3.5 px-4 text-right">Loan Amount</th>
                  <th className="py-3.5 px-4 text-right">Fixed Fee</th>
                  <th className="py-3.5 px-4 text-right">Fee %</th>
                  <th className="py-3.5 px-4 text-right">Total Repayment</th>
                  <th className="py-3.5 px-6 text-right">Checkout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0EC]">
                {LOAN_TIERS.map((tier) => {
                  const pkg = getPackageForTier(tier);
                  const pct = ((tier.fee / tier.principal) * 100).toFixed(2);
                  const total = tier.principal + tier.fee;
                  const isCurrent = selectedAmount === tier.principal;

                  return (
                    <tr
                      key={tier.principal}
                      className={`transition-colors ${
                        isCurrent ? 'bg-white' : 'hover:bg-white'
                      }`}
                    >
                      <td className="py-3 px-6 font-semibold text-[#1C1424]">
                        {pkg.name}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1C1424] tabular-nums">
                        {formatKsh(tier.principal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#521878] tabular-nums">
                        {formatKsh(tier.fee)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#5C5268] tabular-nums">
                        {pct}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1C1424] tabular-nums">
                        {formatKsh(total)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectTier(tier, pkg)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            isCurrent
                              ? 'bg-[#521878] text-white'
                              : 'bg-white border border-[#E5E0EC] text-[#521878] hover:bg-[#521878] hover:text-white hover:border-[#521878]'
                          }`}
                        >
                          Select
                        </button>
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
