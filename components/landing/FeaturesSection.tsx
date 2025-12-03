"use client";

import {
  Briefcase,
  Users,
  Package,
  ShieldCheck,
  Bell,
  Smartphone,
  MessageCircle,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Briefcase,
    title: "Case Management",
    description:
      "Track investigations from initial report to prosecution with configurable status workflows and automatic case numbering.",
  },
  {
    icon: Users,
    title: "Person Records",
    description:
      "Biometrics integration, national ID support for any country, encrypted PII storage with comprehensive alias tracking.",
  },
  {
    icon: Package,
    title: "Evidence Tracking",
    description:
      "QR code tracking for physical evidence, complete chain of custody logs, and SHA-256 file integrity verification.",
  },
  {
    icon: ShieldCheck,
    title: "Background Checks",
    description:
      "Officer and citizen verification via web portal or USSD. Privacy-preserving results for public requests.",
  },
  {
    icon: Bell,
    title: "Alerts System",
    description:
      "Amber Alerts for missing children and Wanted Notices with public distribution and expiry management.",
  },
  {
    icon: Smartphone,
    title: "USSD Support",
    description:
      "Full system access via feature phones. No smartphone or data plan required - works on any 2G network.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integration",
    description:
      "Field officers can perform wanted person checks and queries via WhatsApp on smartphones.",
  },
];

export function FeaturesSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="features" className="py-20 md:py-28 lg:py-32 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Everything Law Enforcement Needs
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            A comprehensive suite of tools designed specifically for African law
            enforcement agencies, built to work in real-world conditions.
          </p>
        </div>

        {/* Features Grid */}
        <div
          ref={ref}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "opacity-0",
                isInView && "animate-fade-in-up",
                isInView && `animation-delay-${(index + 1) * 100}`
              )}
              style={{
                animationDelay: isInView ? `${index * 100}ms` : undefined,
              }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
