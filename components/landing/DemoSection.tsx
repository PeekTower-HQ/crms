"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const screenshots = [
  {
    src: "/sample_screens/Dashboard.png",
    title: "Dashboard",
    description: "Central command center with real-time statistics and quick actions",
  },
  {
    src: "/sample_screens/Cases.png",
    title: "Case Management",
    description: "Track investigations from initial report to prosecution",
  },
  {
    src: "/sample_screens/BG_check.png",
    title: "Background Checks",
    description: "Instant verification for officers and citizens via web or USSD",
  },
  {
    src: "/sample_screens/vehicle.png",
    title: "Vehicle Records",
    description: "Comprehensive vehicle tracking and search capabilities",
  },
  {
    src: "/sample_screens/Login Page.png",
    title: "Secure Login",
    description: "Badge-based authentication with MFA support",
  },
  {
    src: "/sample_screens/PWA_1.png",
    title: "Offline Mode",
    description: "Full functionality even without internet connection",
  },
  {
    src: "/sample_screens/PWA_2.png",
    title: "Mobile Ready",
    description: "Progressive Web App works on any device",
  },
  {
    src: "/sample_screens/USSD.png",
    title: "USSD Field Tool",
    description: "Access CRMS from any feature phone via USSD - no smartphone required",
  },
  {
    src: "/sample_screens/whatsapp.jpg",
    title: "WhatsApp Field Tool",
    description: "Perform wanted person checks and queries via WhatsApp on smartphones",
  },
  {
    src: "/sample_screens/channel.png",
    title: "WhatsApp Newsletters",
    description: "Broadcast public safety alerts, wanted persons, amber alerts, and community updates via WhatsApp channels",
  },
];

export function DemoSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            See It In Action
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Explore the intuitive interface designed for law enforcement
            professionals across Africa.
          </p>
        </div>

        {/* Carousel Container */}
        <div
          ref={ref}
          className={cn(
            "relative max-w-5xl mx-auto opacity-0",
            isInView && "animate-fade-in-up"
          )}
        >
          {/* Main Screenshot Display */}
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200/80 bg-white ring-1 ring-black/5">
            {/* Screenshot */}
            <div className="relative aspect-[16/9] bg-gray-100">
              <Image
                src={screenshots[currentIndex].src}
                alt={screenshots[currentIndex].title}
                fill
                className="object-cover object-top transition-opacity duration-300"
                priority={currentIndex === 0}
              />
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-700 hover:text-gray-900"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-700 hover:text-gray-900"
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Screenshot Info */}
          <div className="text-center mt-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {screenshots[currentIndex].title}
            </h3>
            <p className="text-gray-600">
              {screenshots[currentIndex].description}
            </p>
          </div>

          {/* Dot Navigation */}
          <div className="flex justify-center gap-2 mt-6">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-blue-700 w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to screenshot ${index + 1}`}
              />
            ))}
          </div>

          {/* Thumbnail Navigation */}
          <div className="hidden md:flex justify-center gap-3 mt-8">
            {screenshots.map((screenshot, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "relative w-24 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300",
                  index === currentIndex
                    ? "border-blue-700 ring-2 ring-blue-700/20"
                    : "border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100"
                )}
                aria-label={`View ${screenshot.title}`}
              >
                <Image
                  src={screenshot.src}
                  alt={screenshot.title}
                  fill
                  className="object-cover object-top"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
