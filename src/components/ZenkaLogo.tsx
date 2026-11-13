interface ZenkaLogoProps {
  className?: string;
  showWordmark?: boolean;
  tone?: 'dark' | 'light';
}

export function ZenkaLogo({
  className = '',
  showWordmark = true,
  tone = 'dark',
}: ZenkaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Signature Zenka interlocking golden geometric S/Z mark */}
        <path
          d="M18.4 4.5C15.8 4.5 13.7 5.7 12.2 7.2L6.8 12.6C4.7 14.7 4.7 18.1 6.8 20.2L9.3 22.7L12.7 19.3L10.2 16.8C9.9 16.5 9.9 16 10.2 15.7L15.6 10.3C16.3 9.6 17.3 9.2 18.4 9.2C19.5 9.2 20.5 9.6 21.2 10.3L25.8 14.9L29.2 11.5L24.6 6.9C22.9 5.3 20.8 4.5 18.4 4.5Z"
          fill="#FFD200"
        />
        <path
          d="M17.6 31.5C20.2 31.5 22.3 30.3 23.8 28.8L29.2 23.4C31.3 21.3 31.3 17.9 29.2 15.8L26.7 13.3L23.3 16.7L25.8 19.2C26.1 19.5 26.1 20 25.8 20.3L20.4 25.7C19.7 26.4 18.7 26.8 17.6 26.8C16.5 26.8 15.5 26.4 14.8 25.7L10.2 21.1L6.8 24.5L11.4 29.1C13.1 30.7 15.2 31.5 17.6 31.5Z"
          fill="#FFD200"
        />
        <path
          d="M14.2 15.2L21.8 20.8L18.4 24.2L10.8 18.6L14.2 15.2Z"
          fill="#F2B705"
        />
      </svg>
      {showWordmark && (
        <span
          className={`font-display text-xl font-bold tracking-[0.18em] whitespace-nowrap shrink-0 ${
            tone === 'light' ? 'text-white' : 'text-[#1C1424]'
          }`}
        >
          ZENKA
        </span>
      )}
    </span>
  );
}
