interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const baseClass = "bg-gradient-to-r from-elevated via-border to-elevated bg-[length:200%_100%] animate-shimmer rounded";

  if (variant === "circle") {
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: width || 32, height: height || 32 }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div className={`${baseClass} p-4 ${className}`} style={{ width, height }}>
        <div className="space-y-3">
          <div className="h-3 w-3/4 bg-elevated/50 rounded" />
          <div className="h-3 w-1/2 bg-elevated/50 rounded" />
          <div className="h-3 w-full bg-elevated/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ width: width || "100%", height: height || 16 }}
    />
  );
}
