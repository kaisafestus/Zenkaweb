import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ZenkaLogo } from './ZenkaLogo';

interface TopNavProps {
  onApplyClick: () => void;
}

const NAV_LINKS = [
  { label: 'Calculator', href: '#calculator' },
  { label: 'Packages', href: '#packages' },
  { label: 'Extensions', href: '#extensions' },
  { label: 'Referrals', href: '#referrals' },
];

export function TopNav({ onApplyClick }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E5E0EC]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#521878] rounded-md"
        >
          <ZenkaLogo tone="dark" />
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C5268]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 hover:text-[#521878] hover:underline underline-offset-8 decoration-2 decoration-[#FFD200] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#521878]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onApplyClick}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#521878] hover:bg-[#3B0F58] rounded-full transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#521878]"
          >
            Apply Now
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1C1424] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E0EC] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-medium text-[#1C1424] hover:text-[#521878]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onApplyClick();
            }}
            className="w-full py-3 text-sm font-semibold text-white bg-[#521878] hover:bg-[#3B0F58] rounded-full transition-colors cursor-pointer"
          >
            Apply Now
          </button>
        </div>
      )}
    </header>
  );
}
