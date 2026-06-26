"use client";

import { motion } from "framer-motion";
import SourcePill from "@/components/ui/SourcePill";
import type { SourceType } from "@/lib/constants";

interface EvidenceItem {
  source: SourceType;
  excerpt: string;
  author?: string;
}

interface ClusterEvidenceProps {
  items: EvidenceItem[];
  className?: string;
}

export default function ClusterEvidence({ items, className = "" }: ClusterEvidenceProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        Evidence Panel
      </h4>
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-3 p-3 rounded-lg bg-elevated/20 border border-border"
        >
          <SourcePill source={item.source} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary leading-relaxed">
              &ldquo;{item.excerpt}&rdquo;
            </p>
            {item.author && (
              <p className="text-[10px] text-text-muted mt-1">— {item.author}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
