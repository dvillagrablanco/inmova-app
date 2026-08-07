import { cn } from "@/lib/cn";
import type { Rating } from "@/lib/types";

const RATING = {
  A: { stroke: "#059669", text: "text-emerald-700", ring: "text-emerald-500" },
  B: { stroke: "#65a30d", text: "text-lime-700", ring: "text-lime-500" },
  C: { stroke: "#d97706", text: "text-amber-700", ring: "text-amber-500" },
  D: { stroke: "#e11d48", text: "text-rose-700", ring: "text-rose-500" },
} as const;

/** Puntuación como anillo de progreso circular. */
export function ScoreBadge({ score, rating, size = "md" }: { score: number; rating: Rating; size?: "sm" | "md" | "lg" }) {
  const px = { sm: 40, md: 52, lg: 68 }[size];
  const stroke = { sm: 4, md: 5, lg: 6 }[size];
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const conf = RATING[rating] ?? RATING.D;
  const font = { sm: "text-sm", md: "text-base", lg: "text-xl" }[size];

  return (
    <div className="relative shrink-0" style={{ width: px, height: px }} title={`Score ${score}/100 · ${rating}`}>
      <svg width={px} height={px} className="-rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-ink-100" />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={conf.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className={cn("absolute inset-0 grid place-items-center font-extrabold", font, conf.text)}>{score}</div>
    </div>
  );
}

export function RatingPill({ rating }: { rating: Rating }) {
  const conf = RATING[rating] ?? RATING.D;
  return <span className={cn("chip bg-white ring-ink-200", conf.text)}>{rating}</span>;
}
