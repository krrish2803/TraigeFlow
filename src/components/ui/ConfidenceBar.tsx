interface ConfidenceBarProps {
  value: number;
  className?: string;
}

export default function ConfidenceBar({ value, className = "" }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--accent-primary), var(--accent-success))",
          }}
        />
      </div>
      <span className="text-[11px] font-mono text-text-secondary w-8 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}
