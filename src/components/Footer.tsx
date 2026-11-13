import { ZenkaLogo } from './ZenkaLogo';

export function Footer() {
  return (
    <footer className="bg-[#141212] text-white py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/15">
          <ZenkaLogo tone="light" />

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6 text-xs font-medium text-white/75"
          >
            <a href="#calculator" className="hover:text-[#FFD200] transition-colors">
              Loan Calculator
            </a>
            <a href="#packages" className="hover:text-[#FFD200] transition-colors">
              Packages &amp; Fees
            </a>
            <a href="#extensions" className="hover:text-[#FFD200] transition-colors">
              61-Day Extensions
            </a>
            <a href="#referrals" className="hover:text-[#FFD200] transition-colors">
              Invite &amp; Earn
            </a>
          </nav>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-white/60 leading-relaxed">
          <p className="max-w-2xl">
            Zenka Web Portal · Licensed Digital Credit Provider Framework · All figures displayed in Kenyan Shillings (KSh). Terms and credit limits depend on borrower eligibility and timely repayment history.
          </p>
          <p className="whitespace-nowrap shrink-0">
            Support: 0800 724 888 · Nairobi, Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}
