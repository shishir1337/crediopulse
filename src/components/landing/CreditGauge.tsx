import type { CSSProperties } from "react";

type Band = {
  label: string;
  color: string;
};

function bandFor(score: number): Band {
  if (score < 580) return { label: "Poor", color: "var(--color-meter-poor)" };
  if (score < 670) return { label: "Fair", color: "var(--color-meter-fair)" };
  if (score < 740) return { label: "Good", color: "var(--color-meter-good)" };
  if (score < 800)
    return { label: "Very Good", color: "var(--color-meter-great)" };
  return { label: "Excellent", color: "var(--color-meter-excellent)" };
}

type CreditGaugeProps = {
  score: number;
  label?: string;
  size?: number;
  min?: number;
  max?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * The brand signature: a 270° speedometer dial rendered as crisp SVG.
 * Used at multiple sizes across the page.
 */
export default function CreditGauge({
  score,
  label,
  size = 220,
  min = 300,
  max = 850,
  className,
  style,
}: CreditGaugeProps) {
  const stroke = Math.max(8, size * 0.072);
  const radius = size / 2 - stroke / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° visible
  const fraction = Math.min(1, Math.max(0, (score - min) / (max - min)));
  const band = bandFor(score);

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative", ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Credit score ${score}, rated ${band.label}`}
      >
        <defs>
          <linearGradient
            id={`meter-grad-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-meter-fair)" />
            <stop offset="55%" stopColor="var(--color-meter-great)" />
            <stop offset="100%" stopColor="var(--color-meter-excellent)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#meter-grad-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc * fraction} ${circumference}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Tick at the live value */}
        <circle
          cx={cx + radius * Math.cos((135 + fraction * 270) * (Math.PI / 180))}
          cy={cy + radius * Math.sin((135 + fraction * 270) * (Math.PI / 180))}
          r={stroke * 0.42}
          fill="#fff"
          stroke={band.color}
          strokeWidth={stroke * 0.28}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none tracking-tight"
          style={{ fontSize: size * 0.27, color: band.color }}
        >
          {score}
        </span>
        <span
          className="mt-1 font-semibold uppercase tracking-[0.18em] text-ink-soft"
          style={{ fontSize: size * 0.062 }}
        >
          {label ?? band.label}
        </span>
      </div>
    </div>
  );
}
