"use client";

import { cn } from "@/lib/utils";

type SparklineProps = {
  data?: number[];
  className?: string;
  strokeClassName?: string;
};

export function Sparkline({
  data = [4, 6, 5, 8, 7, 9, 11, 10, 12],
  className,
  strokeClassName = "stroke-primary-500",
}: SparklineProps) {
  const w = 72;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("w-[72px] h-7 shrink-0", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={cn(strokeClassName, "opacity-90")}
      />
    </svg>
  );
}
