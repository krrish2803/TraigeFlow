import { SOURCE_CONFIG, type SourceType } from "@/lib/constants";

interface SourcePillProps {
  source: SourceType;
  size?: "sm" | "md";
  className?: string;
}

export default function SourcePill({ source, size = "sm", className = "" }: SourcePillProps) {
  const config = SOURCE_CONFIG[source];
  const sizeClasses = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wider ${sizeClasses} ${className}`}
      style={{ backgroundColor: `${config.color}33`, color: config.color }}
    >
      <span className="font-bold">{config.icon}</span>
      {size === "md" && <span>{config.label}</span>}
    </span>
  );
}
