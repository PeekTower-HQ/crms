"use client";

import { Shield, Lock, FileCheck, Eye, Database, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const securityFeatures = [
  {
    icon: Lock,
    title: "Encryption at Rest",
    description: "AES-256 encryption for all PII and sensitive data",
  },
  {
    icon: Shield,
    title: "Secure Transport",
    description: "TLS 1.3 for all data in transit",
  },
  {
    icon: Key,
    title: "Strong Authentication",
    description: "Argon2id password hashing with MFA support",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description: "Immutable logs tracking every action",
  },
  {
    icon: Database,
    title: "SQL Injection Prevention",
    description: "Parameterized queries via Prisma ORM",
  },
  {
    icon: FileCheck,
    title: "Evidence Integrity",
    description: "SHA-256 verification for all files",
  },
];

const complianceBadges = [
  { label: "OWASP Top 10", color: "bg-blue-900" },
  { label: "GDPR Compliant", color: "bg-blue-800" },
  { label: "Malabo Convention", color: "bg-blue-700" },
  { label: "SDG 16 Aligned", color: "bg-green-700" },
];

export function SecuritySection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="security" className="py-20 md:py-28 lg:py-32 bg-gray-900 text-white relative overflow-hidden">
      {/* Background gradient orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-blue-700 mb-8 shadow-lg shadow-blue-700/30">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
            Enterprise-Grade Security
          </h2>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            Criminal justice data demands the highest security standards. CRMS
            is built with security at every layer.
          </p>
        </div>

        {/* Security Features Grid */}
        <div
          ref={ref}
          className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-14"
        >
          {securityFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group p-6 md:p-8 rounded-xl bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-lg shadow-black/20 hover:bg-gray-800/90 hover:border-gray-600/50 hover:-translate-y-0.5 transition-all duration-300 opacity-0",
                isInView && "animate-fade-in-up"
              )}
              style={{
                animationDelay: isInView ? `${index * 100}ms` : undefined,
              }}
            >
              <div className="relative mb-5">
                <feature.icon className="h-7 w-7 text-blue-400" />
                <div className="absolute inset-0 h-7 w-7 bg-blue-400/20 blur-lg" />
              </div>
              <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Compliance Badges */}
        <div className="flex flex-wrap gap-4 justify-center">
          {complianceBadges.map((badge, index) => (
            <Badge
              key={badge.label}
              className={cn(
                badge.color,
                "text-white border-0 px-5 py-2.5 text-sm font-medium ring-1 ring-white/10 hover:ring-white/20 hover:scale-105 transition-all duration-200 opacity-0",
                isInView && "animate-fade-in"
              )}
              style={{
                animationDelay: isInView ? `${600 + index * 100}ms` : undefined,
              }}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
