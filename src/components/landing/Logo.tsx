type LogoProps = {
  className?: string;
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  tone?: "light" | "dark";
  showWord?: boolean;
};

/** The Credio Pulse mark: a compact gauge sweep + wordmark. */
export default function Logo({
  className = "",
  tone = "dark",
  showWord = true,
}: LogoProps) {
  const word = tone === "light" ? "text-white" : "text-ink";
  const accent = tone === "light" ? "text-brand-300" : "text-brand-600";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="17"
          cy="17"
          r="13"
          stroke="currentColor"
          className={tone === "light" ? "text-white/15" : "text-ink/10"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="61.2 81.6"
          transform="rotate(135 17 17)"
        />
        <circle
          cx="17"
          cy="17"
          r="13"
          stroke="url(#logo-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="45 81.6"
          transform="rotate(135 17 17)"
        />
        <circle cx="17" cy="17" r="3.4" fill="url(#logo-grad)" />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="34" y2="34">
            <stop stopColor="#2f6bff" />
            <stop offset="1" stopColor="#38e0ff" />
          </linearGradient>
        </defs>
      </svg>
      {showWord && (
        <span
          className={`font-display text-[1.28rem] font-bold leading-none tracking-tight ${word}`}
        >
          Credio <span className={accent}>Pulse</span>
        </span>
      )}
    </span>
  );
}
