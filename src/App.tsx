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
  calculateLoanBreakdown,
} from './data/loanPackages';

export default function App() {
  const [amount, setAmount] = useState<number>(20000);
  const [termDays, setTermDays] = useState<LoanTermDays>(61);
  const [isLoyalMember, setIsLoyalMember] = useState<boolean>(false);
  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent | null>(
    null
  );

  const calculation = useMemo(
    () => calculateLoanBreakdown(amount, termDays, isLoyalMember),
    [amount, termDays, isLoyalMember]
  );

  const handleSelectPackage = (pkg: LoanPackage) => {
    const preferredTerm =
      pkg.supportedTerms[pkg.supportedTerms.length - 1] ?? 61;
    setAmount(pkg.examplePrincipal);
    setTermDays(preferredTerm);
    const updatedCalc = calculateLoanBreakdown(
      pkg.examplePrincipal,
      preferredTerm,
      isLoyalMember
    );
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

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9FC] text-[#1C1424]">
      <TopNav onApplyClick={handleOpenLoanCheckout} />

      <main className="flex-1">
        <HeroCalculator
          amount={amount}
          termDays={termDays}
          isLoyalMember={isLoyalMember}
          calculation={calculation}
          onAmountChange={setAmount}
          onTermChange={setTermDays}
          onLoyalToggle={setIsLoyalMember}
          onApply={handleOpenLoanCheckout}
        />

        <LoanPackagesSection
          selectedPackageId={calculation.matchedPackage.id}
          isLoyalMember={isLoyalMember}
          onLoyalToggle={setIsLoyalMember}
          onSelectPackage={handleSelectPackage}
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
