"use client";

import { Button } from "@/components/ui/button";
import { Building2, Code2, Handshake } from "lucide-react";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const ctaCards = [
  {
    icon: Building2,
    title: "For Government",
    description: "Deploy CRMS in your country with our support",
    cta: "Request Consultation",
    href: "mailto:deploy@crms-africa.org?subject=Government Deployment Inquiry",
  },
  {
    icon: Code2,
    title: "For Technical Teams",
    description: "Explore the codebase and contribute",
    cta: "View on GitHub",
    href: "https://github.com/PeekTower-HQ/crms",
    external: true,
  },
  {
    icon: Handshake,
    title: "For Partners",
    description: "Join us in scaling justice across Africa",
    cta: "Partner With Us",
    href: "mailto:deploy@crms-africa.org?subject=Partnership Inquiry",
  },
];

export function CTASection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Join law enforcement agencies across Africa in building safer, more
            connected communities.
          </p>
        </div>

        {/* CTA Cards */}
        <div ref={ref} className="grid gap-8 md:grid-cols-3">
          {ctaCards.map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "group text-center p-8 md:p-10 rounded-2xl bg-white border border-gray-200/80 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:ring-blue-100 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 opacity-0",
                isInView && "animate-fade-in-up"
              )}
              style={{
                animationDelay: isInView ? `${index * 150}ms` : undefined,
              }}
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-100 mb-8 group-hover:scale-105 transition-transform duration-300">
                <card.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                {card.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">{card.description}</p>
              <Button
                variant="outline"
                className="w-full border-blue-700/80 text-blue-700 hover:bg-blue-50 hover:border-blue-700 shadow-sm hover:shadow transition-all duration-200"
                asChild
              >
                <a
                  href={card.href}
                  {...(card.external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                >
                  {card.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="bg-blue-700 hover:bg-blue-800 text-white text-base px-10 py-6 h-auto shadow-lg shadow-blue-700/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            asChild
          >
            <a href="mailto:deploy@crms-africa.org?subject=CRMS Demo Request">
              Request a Demo
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
