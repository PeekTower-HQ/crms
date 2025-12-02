"use client";

import { Wifi, Globe2, Lock } from "lucide-react";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const usps = [
  {
    icon: Wifi,
    title: "Works When Internet Doesn't",
    subtitle: "Offline-First Architecture",
    description:
      "Built with Service Workers and IndexedDB for full offline operation. Create, update, and manage cases even without internet. Auto-sync when connection is restored.",
    highlights: ["Full offline CRUD", "Auto-sync queue", "Conflict resolution"],
  },
  {
    icon: Globe2,
    title: "Configure, Don't Fork",
    subtitle: "Multi-Country Ready",
    description:
      "Deploy to any African country with configuration changes only. Support for any national ID system, legal framework, and language without code modifications.",
    highlights: ["54 countries supported", "Any national ID", "Multi-language"],
  },
  {
    icon: Lock,
    title: "Your Data, Your Infrastructure",
    subtitle: "Open & Sovereign",
    description:
      "MIT licensed with no vendor lock-in. Self-host on your own infrastructure. Each country maintains complete control over their deployment and data.",
    highlights: ["MIT licensed", "Self-hostable", "Data sovereignty"],
  },
];

export function USPSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Why CRMS is Different
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Built from the ground up for African realities - not adapted from
            Western solutions.
          </p>
        </div>

        {/* USP Cards */}
        <div ref={ref} className="grid gap-8 lg:gap-10 lg:grid-cols-3">
          {usps.map((usp, index) => (
            <div
              key={usp.title}
              className={cn(
                "group relative p-8 md:p-10 rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 shadow-sm hover:shadow-lg hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 opacity-0",
                isInView && "animate-fade-in-up"
              )}
              style={{
                animationDelay: isInView ? `${index * 150}ms` : undefined,
              }}
            >
              {/* Icon */}
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-700/25 ring-1 ring-blue-600 group-hover:scale-105 transition-transform duration-300">
                <usp.icon className="h-8 w-8" />
              </div>

              {/* Content */}
              <div className="mb-3 text-xs font-semibold text-blue-700 uppercase tracking-widest">
                {usp.subtitle}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                {usp.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">{usp.description}</p>

              {/* Highlights */}
              <ul className="space-y-3">
                {usp.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-center gap-3 text-sm font-medium text-gray-700"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                      <svg
                        className="h-3 w-3 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
