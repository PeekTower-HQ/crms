"use client";

import { useInView } from "./hooks/useInView";
import { useCountUp } from "./hooks/useCountUp";

interface StatCounterProps {
  end: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function StatCounter({ end, label, suffix = "", prefix = "" }: StatCounterProps) {
  const { ref, isInView } = useInView({ threshold: 0.5 });
  const count = useCountUp(end, isInView);

  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-700 tracking-tight tabular-nums group-hover:scale-105 transition-transform duration-300">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-3 text-gray-600 text-sm md:text-base font-medium tracking-wide">{label}</div>
    </div>
  );
}
