"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function generateSparkle(color: string) {
  return {
    id: Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    color,
    size: Math.random() * 10 + 5,
    style: {
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
    },
  };
}

function SparkleInstance({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style: React.CSSProperties;
}) {
  return (
    <motion.span
      className="absolute pointer-events-none"
      style={style}
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0], rotate: [0, 90, 180], opacity: [0, 1, 0] }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M80 0C80 0 84.2 41.2 97.9 62.1C111.6 83 160 80 160 80C160 80 111.6 77 97.9 97.9C84.2 118.8 80 160 80 160C80 160 75.8 118.8 62.1 97.9C48.4 77 0 80 0 80C0 80 48.4 83 62.1 62.1C75.8 41.2 80 0 80 0Z"
          fill={color}
        />
      </svg>
    </motion.span>
  );
}

export default function Sparkles({
  children,
  className,
  color = "#fbbf24",
  count = 20,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  count?: number;
}) {
  const [sparkles, setSparkles] = useState(() =>
    Array.from({ length: count }, () => generateSparkle(color))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) => {
        const now = Date.now();
        const filtered = prev.filter((s) => now - s.createdAt < 750);
        if (filtered.length < count) {
          filtered.push(generateSparkle(color));
        }
        return filtered;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [color, count]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <SparkleInstance
          key={sparkle.id}
          color={sparkle.color}
          size={sparkle.size}
          style={sparkle.style}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}
