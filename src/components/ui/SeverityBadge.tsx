import { SEVERITY_CONFIG, type SeverityLevel } from "@/lib/constants";

interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
}

export default function SeverityBadge({ level, className = "" }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
