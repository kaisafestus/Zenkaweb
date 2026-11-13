export type LoanTermDays = 14 | 30 | 61;

export interface LoanPackage {
  id: string;
  name: string;
  audience: string;
  minAmount: number;
  maxAmount: number;
  baseFeePercent: number;
  loyalFeePercent: number;
  supportedTerms: LoanTermDays[];
  gracePeriodDays: number;
  disbursementSpeed: string;
  examplePrincipal: number;
  recommended?: boolean;
  summary: string;
}

export interface ExtensionOption {
  days: 7 | 14 | 30;
  feePercent: number;
  label: string;
  note: string;
}

export interface LoanCalculation {
  amount: number;
  termDays: LoanTermDays;
  isLoyalMember: boolean;
  matchedPackage: LoanPackage;
  effectiveFeePercent: number;
  feeAmount: number;
  totalRepayment: number;
  dailyCost: number;
  dueDateFormatted: string;
}

export const LOAN_PACKAGES: LoanPackage[] = [
  {
    id: 'starter-flex',
    name: 'Starter Flex',
    audience: 'For first-time borrowers and everyday needs',
    minAmount: 500,
    maxAmount: 10000,
    baseFeePercent: 3.0,
    loyalFeePercent: 2.6,
    supportedTerms: [14, 30],
    gracePeriodDays: 3,
    disbursementSpeed: 'Instant via M-Pesa',
    examplePrincipal: 5000,
    summary: 'Low entry threshold with predictable flat facilitation fees and zero hidden charges.',
  },
  {
    id: 'growth-plus',
    name: 'Growth Plus',
    audience: 'For repeat borrowers and household liquidity',
    minAmount: 10500,
    maxAmount: 50000,
    baseFeePercent: 2.8,
    loyalFeePercent: 2.4,
    supportedTerms: [14, 30, 61],
    gracePeriodDays: 7,
    disbursementSpeed: 'Instant via M-Pesa',
    examplePrincipal: 20000,
    recommended: true,
    summary: 'Balanced 61-day flexibility with a complimentary 7-day grace window on timely tracks.',
  },
  {
    id: 'biashara-pro',
    name: 'Biashara Pro',
    audience: 'For SME stock restocks and working capital',
    minAmount: 50500,
    maxAmount: 120000,
    baseFeePercent: 2.5,
    loyalFeePercent: 2.1,
    supportedTerms: [30, 61],
    gracePeriodDays: 7,
    disbursementSpeed: 'Under 3 minutes',
    examplePrincipal: 75000,
    summary: 'Reduced commercial rate built for merchants turning inventory over 30 to 61 days.',
  },
  {
    id: 'zenka-prime',
    name: 'Zenka Prime',
    audience: 'For verified loyal members up to full limit',
    minAmount: 120500,
    maxAmount: 200000,
    baseFeePercent: 2.2,
    loyalFeePercent: 1.8,
    supportedTerms: [61],
    gracePeriodDays: 10,
    disbursementSpeed: 'Priority M-Pesa',
    examplePrincipal: 150000,
    summary: 'Our lowest facilitation rate across 61-day schedules with priority settlement support.',
  },
];

export const EXTENSION_OPTIONS: ExtensionOption[] = [
  {
    days: 7,
    feePercent: 1.5,
    label: '7 Days',
    note: 'Short bridge window',
  },
  {
    days: 14,
    feePercent: 2.5,
    label: '14 Days',
    note: 'Two-week breathing room',
  },
  {
    days: 30,
    feePercent: 4.2,
    label: '30 Days',
    note: 'Full month reschedule',
  },
];

export function formatKsh(value: number, withDecimals = false): string {
  return `KSh ${value.toLocaleString('en-KE', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  })}`;
}

export function addDaysFormatted(days: number): string {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getPackageForAmount(amount: number): LoanPackage {
  const found = LOAN_PACKAGES.find(
    (pkg) => amount >= pkg.minAmount && amount <= pkg.maxAmount
  );
  if (found) return found;
  return amount < LOAN_PACKAGES[0].minAmount
    ? LOAN_PACKAGES[0]
    : LOAN_PACKAGES[LOAN_PACKAGES.length - 1];
}

export function calculateLoanBreakdown(
  amount: number,
  termDays: LoanTermDays,
  isLoyalMember: boolean
): LoanCalculation {
  const clampedAmount = Math.min(200000, Math.max(500, amount));
  const matchedPackage = getPackageForAmount(clampedAmount);
  const basePercent = isLoyalMember
    ? matchedPackage.loyalFeePercent
    : matchedPackage.baseFeePercent;

  // Favorable term scaling: shorter terms carry proportionally lower total fee
  const termFactor = termDays === 14 ? 0.65 : termDays === 30 ? 0.85 : 1.0;
  const effectiveFeePercent = Number((basePercent * termFactor).toFixed(2));
  const feeAmount = Math.round((clampedAmount * effectiveFeePercent) / 100);
  const totalRepayment = clampedAmount + feeAmount;
  const dailyCost = Math.round(totalRepayment / termDays);

  return {
    amount: clampedAmount,
    termDays,
    isLoyalMember,
    matchedPackage,
    effectiveFeePercent,
    feeAmount,
    totalRepayment,
    dailyCost,
    dueDateFormatted: addDaysFormatted(termDays),
  };
}
