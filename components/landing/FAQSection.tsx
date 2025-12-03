"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useInView } from "./hooks/useInView";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How long does deployment take?",
    answer:
      "A typical deployment takes 4-8 weeks depending on customization needs. This includes initial setup, configuration for your country's legal framework, data migration (if applicable), and staff training. Pilot deployments can be operational within 2-3 weeks.",
  },
  {
    question: "What infrastructure is needed?",
    answer:
      "CRMS is designed for low-resource environments. You need a server (cloud or on-premise) running PostgreSQL, and client devices can be any modern browser, feature phones via USSD, or smartphones via WhatsApp. The system works offline and syncs when connectivity is available, so reliable internet isn't required for day-to-day operations.",
  },
  {
    question: "Is training provided?",
    answer:
      "Yes, comprehensive training is included. We provide train-the-trainer programs, video tutorials, and documentation in multiple languages. Our team can conduct on-site training or remote sessions based on your preference. Ongoing support is available post-deployment.",
  },
  {
    question: "How much does CRMS cost?",
    answer:
      "CRMS is open-source and free to use under the MIT license. You only pay for hosting infrastructure (which you control), customization services if needed, and optional support contracts. There are no licensing fees or vendor lock-in.",
  },
  {
    question: "Can CRMS integrate with existing systems?",
    answer:
      "Yes, CRMS provides RESTful APIs for integration with national ID systems, court management systems, and other government databases. We've designed it to be interoperable with existing infrastructure while maintaining data sovereignty.",
  },
  {
    question: "How is data security handled?",
    answer:
      "Security is paramount. CRMS uses AES-256 encryption for data at rest, TLS 1.3 for data in transit, Argon2id for password hashing, and comprehensive audit logging. The system is OWASP Top 10 compliant and follows GDPR and Malabo Convention guidelines.",
  },
  {
    question: "Can we customize CRMS for our country's laws?",
    answer:
      "Absolutely. CRMS is built for multi-country deployment with configuration-based customization. You can adapt case categories, severity levels, workflow statuses, national ID formats, and language without modifying the codebase. Each country maintains full control over their deployment.",
  },
  {
    question: "What support is available after deployment?",
    answer:
      "We offer tiered support options: community support through GitHub (free), email support for pilot countries, and dedicated support contracts for full deployments. Our team provides bug fixes, security updates, and feature guidance throughout your deployment lifecycle.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className={cn(
        "border-b border-gray-200 last:border-b-0",
        "opacity-0 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-500 transition-transform duration-300 flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 pb-6" : "max-h-0"
        )}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Everything you need to know about deploying CRMS in your country.
          </p>
        </div>

        {/* FAQ List */}
        <div
          ref={ref}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200/80 px-6 md:px-8"
        >
          {isInView &&
            faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => toggleFAQ(index)}
                index={index}
              />
            ))}
        </div>

        {/* Contact CTA */}
        <p
          className={cn(
            "text-center text-gray-600 mt-12 opacity-0",
            isInView && "animate-fade-in"
          )}
          style={{ animationDelay: "400ms" }}
        >
          Have more questions?{" "}
          <a
            href="mailto:deploy@crms-africa.org?subject=CRMS Question"
            className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2"
          >
            Contact our team
          </a>
        </p>
      </div>
    </section>
  );
}
