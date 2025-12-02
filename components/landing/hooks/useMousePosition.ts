"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = useState<MousePosition>({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef<MousePosition>({ x: 0.5, y: 0.5 });

  const updatePosition = useCallback(() => {
    setPosition({ ...mouseRef.current });
    rafRef.current = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalize to 0-1 range relative to container
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };

      // Throttle updates via requestAnimationFrame
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseLeave = () => {
      // Reset to center when mouse leaves
      mouseRef.current = { x: 0.5, y: 0.5 };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef, updatePosition]);

  return position;
}
