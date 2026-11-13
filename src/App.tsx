import { useMemo, useState } from 'react';
import { TopNav } from './components/TopNav';
import { HeroCalculator } from './components/HeroCalculator';
import { LoanPackagesSection } from './components/LoanPackagesSection';
import { ExtensionSimulator } from './components/ExtensionSimulator';
import { ReferralBonusSection } from './components/ReferralBonusSection';
import {
  ApplicationDrawer,
  CheckoutIntent,
} from './components/ApplicationDrawer';
import { Footer } from './components/Footer';
import {
  ExtensionOption,
  LoanPackage,
  LoanTermDays,
  LoanTier,
  calculateLoanBreakdown,
} from './data/loanPackages';

export default function App() {
  const [amount, setAmount] = useState<number>(21000);
  const [termDays, setTermDays] = useState<LoanTermDays>(61);
  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent | null>(
    null
  );

  const calculation = useMemo(
    () => calculateLoanBreakdown(amount, termDays),
    [amount, termDays]
  );

  const handleSelectTier = (tier: LoanTier, pkg: LoanPackage) => {
    const preferredTerm =
      pkg.supportedTerms[pkg.supportedTerms.length - 1] ?? 61;
    setAmount(tier.principal);
    setTermDays(preferredTerm);
    const updatedCalc = calculateLoanBreakdown(tier.principal, preferredTerm);
    setCheckoutIntent({ type: 'loan', calculation: updatedCalc });
  };

  const handleOpenLoanCheckout = () => {
    setCheckoutIntent({ type: 'loan', calculation });
  };

  const handleExtendCheckout = (
    balance: number,
    option: ExtensionOption,
    extensionFee: number
  ) => {
    setCheckoutIntent({
      type: 'extension',
      balance,
      option,
      extensionFee,
    });
  };

  const handleWithdrawBonus = (bonusAmount: number, friendCount: number) => {
    setCheckoutIntent({
      type: 'referral',
      bonusAmount,
      friendCount,
    });
  };

  const handleNavApplyClick = () => {
    const packagesEl = document.getElementById('packages');
    if (packagesEl) {
      packagesEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9FC] text-[#1C1424]">
      <TopNav onApplyClick={handleNavApplyClick} />

      <main className="flex-1">
        <HeroCalculator
          amount={amount}
          termDays={termDays}
          calculation={calculation}
          onAmountChange={setAmount}
          onTermChange={setTermDays}
          onApply={handleOpenLoanCheckout}
        />

        <LoanPackagesSection
          selectedAmount={calculation.amount}
          selectedPackageId={calculation.matchedPackage.id}
          onSelectTier={handleSelectTier}
        />

        <ExtensionSimulator onExtendCheckout={handleExtendCheckout} />

        <ReferralBonusSection onWithdrawBonus={handleWithdrawBonus} />
      </main>

      <Footer />

      <ApplicationDrawer
        intent={checkoutIntent}
        onClose={() => setCheckoutIntent(null)}
      />
    </div>
  );
}
