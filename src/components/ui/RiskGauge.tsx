"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export default function RiskGauge({ score, size = 180, className = "" }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedScore / 100);

  const getColor = (s: number) => {
    if (s < 40) return "var(--accent-success)";
    if (s < 70) return "var(--accent-warn)";
    return "var(--accent-secondary)";
  };

  const getLabel = (s: number) => {
    if (s < 40) return "SAFE";
    if (s < 70) return "CAUTION";
    return "BLOCK";
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="var(--bg-border)"
          strokeWidth="10"
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={getColor(animatedScore)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="82" textAnchor="middle" fill="var(--text-primary)" className="font-mono text-[32px] font-bold">
          {Math.round(animatedScore)}%
        </text>
        <text x="90" y="108" textAnchor="middle" fill={getColor(animatedScore)} className="text-[11px] font-semibold uppercase tracking-wider">
          {getLabel(animatedScore)}
        </text>
      </svg>
    </div>
  );
}
