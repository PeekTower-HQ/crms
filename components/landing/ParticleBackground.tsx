"use client";

import { useRef, useState, useEffect } from "react";
import { useMousePosition } from "./hooks/useMousePosition";
import { cn } from "@/lib/utils";

interface ParticleBackgroundProps {
  variant: "light" | "dark";
  particleCount?: number;
  className?: string;
}

interface Particle {
  id: number;
  size: number;
  initialX: number;
  initialY: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
}

// Seeded random number generator for consistent values
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function ParticleBackground({
  variant,
  particleCount = 25,
  className,
}: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition(containerRef);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const random = seededRandom(42); // Fixed seed for consistent results
    const generated = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      size: 2 + random() * 2, // 2-4px
      initialX: random() * 100,
      initialY: random() * 100,
      animationDuration: 15 + random() * 10, // 15-25s
      animationDelay: random() * 10, // 0-10s
      opacity: 0.2 + random() * 0.3, // 0.2-0.5
    }));
    setParticles(generated);
  }, [particleCount]);

  // Color based on variant
  const particleColor = variant === "light" ? "bg-blue-400" : "bg-blue-300";

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={
        {
          "--mouse-x": mousePosition.x,
          "--mouse-y": mousePosition.y,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn("absolute rounded-full particle-float", particleColor)}
          style={
            {
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.initialX}%`,
              top: `${particle.initialY}%`,
              opacity: particle.opacity,
              animationDuration: `${particle.animationDuration}s`,
              animationDelay: `${particle.animationDelay}s`,
              "--particle-x": particle.initialX / 100,
              "--particle-y": particle.initialY / 100,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
