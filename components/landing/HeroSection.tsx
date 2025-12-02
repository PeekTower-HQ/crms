"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Globe, FileCheck, Shield } from "lucide-react";
import { ParticleBackground } from "./ParticleBackground";

const trustBadges = [
  { icon: Globe, label: "SDG 16 Aligned", color: "bg-green-100 text-green-700" },
  { icon: FileCheck, label: "MIT Licensed", color: "bg-blue-100 text-blue-700" },
  { icon: Check, label: "91% Complete", color: "bg-blue-100 text-blue-700" },
  { icon: Shield, label: "OWASP Compliant", color: "bg-blue-100 text-blue-700" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32">
      {/* Floating particles background */}
      <ParticleBackground variant="light" particleCount={20} />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8 opacity-0 animate-fade-in-up">
              {trustBadges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="secondary"
                  className={`${badge.color} border-0 gap-1.5 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200`}
                >
                  <badge.icon className="h-3 w-3" />
                  {badge.label}
                </Badge>
              ))}
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight leading-[1.1] text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl opacity-0 animate-fade-in-up animation-delay-100">
              Modern Criminal Records Management{" "}
              <span className="text-blue-700">for Africa</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 opacity-0 animate-fade-in-up animation-delay-200">
              An open-source Digital Public Good designed for law enforcement
              agencies. Offline-first, works on 2G/3G networks, and ready for
              deployment in 54 countries.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-fade-in-up animation-delay-300">
              <Button
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-white text-base px-8 shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href="mailto:deploy@crms-africa.org?subject=CRMS Demo Request">
                  Request Demo
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8"
                asChild
              >
                <a href="/docs">View Documentation</a>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 flex gap-8 md:gap-10 justify-center lg:justify-start opacity-0 animate-fade-in-up animation-delay-400">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">54</div>
                <div className="text-sm text-gray-500 font-medium">Countries Ready</div>
              </div>
              <div className="text-center lg:text-left pl-8 border-l border-gray-200">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">144+</div>
                <div className="text-sm text-gray-500 font-medium">Test Cases</div>
              </div>
              <div className="text-center lg:text-left pl-8 border-l border-gray-200">
                <div className="text-3xl font-bold text-gray-900">USSD</div>
                <div className="text-sm text-gray-500 font-medium">Feature Phone Support</div>
              </div>
            </div>
          </div>

          {/* Dashboard Screenshot */}
          <div className="relative lg:order-last opacity-0 animate-fade-in animation-delay-300">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Decorative background */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-10 blur-2xl" />

              {/* Screenshot container */}
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200/80 bg-white ring-1 ring-black/5">
                <Image
                  src="/sample_screens/Dashboard.png"
                  alt="CRMS Dashboard showing case management interface with statistics and navigation"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg shadow-gray-200/50 px-4 py-3 border border-gray-100 ring-1 ring-black/5 animate-float">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Works Offline
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl" />
    </section>
  );
}
