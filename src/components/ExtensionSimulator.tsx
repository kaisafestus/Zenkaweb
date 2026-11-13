import { useState } from 'react';
import { CalendarClock, Check } from 'lucide-react';
import {
  EXTENSION_OPTIONS,
  ExtensionOption,
  addDaysFormatted,
  formatKsh,
} from '../data/loanPackages';

interface ExtensionSimulatorProps {
  onExtendCheckout: (balance: number, option: ExtensionOption, extensionFee: number) => void;
}

const BALANCE_PRESETS = [3168, 10000, 25000, 50000];

export function ExtensionSimulator({ onExtendCheckout }: ExtensionSimulatorProps) {
  const [currentBalance, setCurrentBalance] = useState<number>(3168);
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(7);

  const selectedOption =
    EXTENSION_OPTIONS.find((opt) => opt.days === selectedDays) ??
    EXTENSION_OPTIONS[0];

  const extensionFee = Math.round((currentBalance * selectedOption.feePercent) / 100);
  const adjustedTotal = currentBalance + extensionFee;
  const newDueDate = addDaysFormatted(selectedOption.days);

  return (
    <section
      id="extensions"
      className="bg-[#141212] text-white border-b border-white/10 py-16 lg:py-20 relative overflow-hidden"
    >
      {/* Subtle warm bronze backdrop lighting matching Zenka campaign mood */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 35%, rgba(143, 88, 18, 0.38) 0%, rgba(20, 18, 18, 0.96) 58%)',
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FFD200] text-[#521878] mb-6 select-none">
              <div className="text-center leading-none">
                <span className="block font-display text-xl font-extrabold">
                  61 DAY
                </span>
                <span className="block font-display text-xs font-semibold tracking-wider text-[#141212] mt-0.5">
                  TERMS
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold tracking-wide text-[#FFD200] mb-2">
              02. Flexible Repayment Extensions
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4"
              style={{ textWrap: 'balance' }}
            >
              Need extra breathing room? Extend your loan with low flat fees.
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed mb-6">
              Cash flow timing changes. Instead of harsh default penalties, Zenka lets you shift your repayment window by 7, 14, or 30 days in seconds—and settles the extension fee cleanly via M-Pesa.
            </p>

            <dl className="grid grid-cols-2 gap-4 pt-6 border-t border-white/15 text-sm">
              <div>
                <dt className="text-white/60 text-xs">Credit Standing</dt>
                <dd className="font-semibold text-white mt-1">
                  Protects CRB score
                </dd>
              </div>
              <div>
                <dt className="text-white/60 text-xs">Settlement Flow</dt>
                <dd className="font-semibold text-[#FFD200] mt-1">
                  Instant M-Pesa confirmation
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Interactive Extension Widget (Inspired by Screenshot 3) */}
          <div className="lg:col-span-7 bg-white text-[#1C1424] rounded-2xl p-6 sm:p-8 border border-[#E5E0EC]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0EC]">
              <div>
                <h3 className="font-display text-2xl font-bold text-[#1C1424]">
                  Extend your loan!
                </h3>
                <p className="text-xs text-[#5C5268] mt-1">
                  Select your current balance and preferred repayment window.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#521878]">
                <CalendarClock className="w-4 h-4 shrink-0" />
                <span className="tabular-nums">New due: {newDueDate}</span>
              </div>
            </div>

            {/* Balance Input & Quick Presets */}
            <div className="pt-5 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <label
                  htmlFor="extension-balance-input"
                  className="text-xs font-semibold text-[#5C5268] uppercase tracking-wider"
                >
                  Your current loan
                </label>
                <div className="flex items-center border border-[#E5E0EC] rounded-lg px-3 py-1.5 bg-[#FAF9FC] focus-within:border-[#521878]">
                  <span className="text-xs font-semibold text-[#5C5268] mr-1.5">
                    KSh
                  </span>
                  <input
                    id="extension-balance-input"
                    type="number"
                    min={500}
                    max={200000}
                    value={currentBalance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) {
                        setCurrentBalance(Math.min(200000, Math.max(500, val)));
                      }
                    }}
                    className="w-28 text-right font-display text-xl font-bold text-[#1C1424] bg-transparent outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {BALANCE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCurrentBalance(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors tabular-nums cursor-pointer ${
                      currentBalance === preset
                        ? 'bg-[#521878] border-[#521878] text-white'
                        : 'bg-[#FAF9FC] border-[#E5E0EC] text-[#5C5268] hover:text-[#1C1424]'
                    }`}
                  >
                    {formatKsh(preset, preset === 3168)}
                  </button>
                ))}
              </div>
            </div>

            {/* 7 / 14 / 30 Day Tiles matching Screenshot 3 */}
            <div>
              <p className="text-xs font-semibold text-[#5C5268] uppercase tracking-wider mb-3">
                Pick your repayment time:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EXTENSION_OPTIONS.map((option) => {
                  const isSelected = option.days === selectedDays;
                  const optionFee = Math.round(
                    (currentBalance * option.feePercent) / 100
                  );

                  return (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => setSelectedDays(option.days)}
                      className={`rounded-xl p-4 border text-center transition-colors duration-150 cursor-pointer flex flex-col items-center justify-between min-h-[132px] ${
                        isSelected
                          ? 'bg-[#521878] border-[#521878] text-white'
                          : 'bg-white border-[#E5E0EC] text-[#1C1424] hover:border-[#521878]/60'
                      }`}
                    >
                      <div>
                        <span className="block font-display text-3xl font-bold leading-none tabular-nums">
                          {option.days}
                        </span>
                        <span
                          className={`block text-[11px] font-semibold uppercase tracking-wider mt-1 ${
                            isSelected ? 'text-white/80' : 'text-[#5C5268]'
                          }`}
                        >
                          Days
                        </span>
                      </div>

                      <div className="my-2">
                        <span
                          className={`block text-xs font-semibold tabular-nums ${
                            isSelected ? 'text-[#FFD200]' : 'text-[#521878]'
                          }`}
                        >
                          +{formatKsh(optionFee)} ({option.feePercent}%)
                        </span>
                      </div>

                      <div className="text-xs font-semibold flex items-center gap-1">
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 text-[#FFD200]" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <span className="text-[#5C5268]">Choose</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary & Action */}
            <div className="mt-6 pt-5 border-t border-[#E5E0EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#5C5268]">
                  Pay extension fee now ({selectedOption.feePercent}%) · New balance {formatKsh(adjustedTotal, true)}
                </p>
                <p className="font-display text-xl font-bold text-[#1C1424] tabular-nums mt-0.5">
                  Fee due today: {formatKsh(extensionFee, true)}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onExtendCheckout(currentBalance, selectedOption, extensionFee)
                }
                className="px-7 py-3.5 rounded-full bg-[#521878] hover:bg-[#3B0F58] text-white text-sm font-bold tracking-wide transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                EXTEND NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
