"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function CardHoverEffect({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn("grid gap-4", className)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {Array.isArray(children)
        ? children.map((child, idx) => (
            <div
              key={idx}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(idx)}
            >
              <div
                className={cn(
                  "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-sm transition duration-500",
                  hoveredIndex === idx ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="relative">{child}</div>
            </div>
          ))
        : children}
    </div>
  );
}
