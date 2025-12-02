"use client";

import { StatCounter } from "./StatCounter";

const stats = [
  { end: 54, label: "Countries Deployment Ready", suffix: "" },
  { end: 144, label: "Test Cases Passed", suffix: "+" },
  { end: 91, label: "Development Complete", suffix: "%" },
  { end: 200, label: "Words of Documentation", suffix: "K+" },
];

export function StatsSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16">
          {stats.map((stat) => (
            <StatCounter
              key={stat.label}
              end={stat.end}
              label={stat.label}
              suffix={stat.suffix}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
