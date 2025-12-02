"use client";

import { Badge } from "@/components/ui/badge";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const partners = [
  {
    country: "Sierra Leone",
    flag: "🇸🇱",
    status: "Pilot",
    organization: "Sierra Leone Police Force",
    description: "First pilot deployment for criminal records modernization",
  },
];

export function PartnersSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Deploying Across Africa
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            CRMS is being piloted by law enforcement agencies committed to
            modernizing criminal justice systems across the continent.
          </p>
        </div>

        {/* Partners Grid */}
        <div
          ref={ref}
          className="flex justify-center"
        >
          {partners.map((partner, index) => (
            <div
              key={partner.country}
              className={cn(
                "group text-center p-8 md:p-12 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300 max-w-md opacity-0",
                isInView && "animate-fade-in-up"
              )}
              style={{
                animationDelay: isInView ? `${index * 150}ms` : undefined,
              }}
            >
              {/* Flag */}
              <div className="text-7xl md:text-8xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {partner.flag}
              </div>

              {/* Country Name */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                {partner.country}
              </h3>

              {/* Status Badge + Organization */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 px-3 py-1">
                  {partner.status}
                </Badge>
                <span className="text-gray-600 font-medium">
                  {partner.organization}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed">
                {partner.description}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Note */}
        <p
          className={cn(
            "text-center text-gray-500 mt-12 text-sm opacity-0",
            isInView && "animate-fade-in"
          )}
          style={{
            animationDelay: isInView ? "300ms" : undefined,
          }}
        >
          More countries joining soon. Interested in deploying CRMS?{" "}
          <a
            href="mailto:deploy@crms-africa.org?subject=CRMS Deployment Inquiry"
            className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2"
          >
            Get in touch
          </a>
        </p>
      </div>
    </section>
  );
}
