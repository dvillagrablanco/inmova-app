import { cn } from "@/lib/cn";
import type { Rating } from "@/lib/types";

const RATING_STYLES: Record<Rating, string> = {
  A: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  B: "bg-lime-100 text-lime-800 ring-lime-600/20",
  C: "bg-amber-100 text-amber-800 ring-amber-600/20",
  D: "bg-rose-100 text-rose-800 ring-rose-600/20",
};

export function ScoreBadge({ score, rating, size = "md" }: { score: number; rating: Rating; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-16 w-16 text-2xl",
  }[size];
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold ring-1 ring-inset",
        RATING_STYLES[rating],
        sizes
      )}
      title={`Score ${score}/100 · Rating ${rating}`}
    >
      {score}
    </div>
  );
}

export function RatingPill({ rating }: { rating: Rating }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", RATING_STYLES[rating])}>
      {rating}
    </span>
  );
}
