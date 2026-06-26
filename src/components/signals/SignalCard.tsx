"use client";

import { motion } from "framer-motion";
import SourcePill from "@/components/ui/SourcePill";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { CLASSIFICATION_CONFIG, type SourceType, type SeverityLevel, type ClassificationType } from "@/lib/constants";

interface SignalCardProps {
  id: string;
  source: SourceType;
  subject: string;
  author: string;
  channel: string;
  timestamp: string;
  classification?: ClassificationType;
  severity?: SeverityLevel;
  status: string;
  isSelected?: boolean;
  onClick?: () => void;
  isNew?: boolean;
}

export default function SignalCard({
  source,
  subject,
  author,
  channel,
  timestamp,
  classification,
  severity,
  status,
  isSelected,
  onClick,
  isNew,
}: SignalCardProps) {
  const classifyConfig = classification ? CLASSIFICATION_CONFIG[classification] : null;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -20 } : { opacity: 0 }}
      animate={isNew ? { opacity: 1, y: 0 } : { opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`group relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-border/80 hover:bg-elevated/50"
      }`}
      onClick={onClick}
      whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
    >
      {status === "pending" && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full animate-pulse-glow" />
      )}
      {isNew && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className="flex items-start gap-3">
        <SourcePill source={source} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {classifyConfig && (
              <span
                className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${classifyConfig.color}20`,
                  color: classifyConfig.color,
                }}
              >
                {classifyConfig.label}
              </span>
            )}
            {severity && <SeverityBadge level={severity} />}
          </div>
          <p className="text-sm text-text-primary font-medium truncate">{subject}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            <span>{author}</span>
            <span>·</span>
            <span>{channel}</span>
            <span>·</span>
            <span>{timestamp}</span>
          </div>
        </div>
        <span className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-lg">
          →
        </span>
      </div>
    </motion.div>
  );
}
