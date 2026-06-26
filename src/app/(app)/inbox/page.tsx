"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignalCard from "@/components/signals/SignalCard";
import SignalDetailPanel from "@/components/signals/SignalDetailPanel";
import SourcePill from "@/components/ui/SourcePill";
import Pagination from "@/components/ui/Pagination";
import { useSignalsPaginated } from "@/lib/use-data";
import type { SourceType } from "@/lib/constants";

const SOURCES: { label: string; value: SourceType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Slack", value: "slack" },
  { label: "Gmail", value: "gmail" },
  { label: "GitHub", value: "github" },
  { label: "Jira", value: "jira" },
];

export default function InboxPage() {
  const [selectedSource, setSelectedSource] = useState<SourceType | "all">("all");
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const { data, loading, error, setPage, page } = useSignalsPaginated(20);

  const signals = data?.items ?? [];
  const filtered = selectedSource === "all"
    ? signals
    : signals.filter((s) => s.source === selectedSource);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-warn/10 flex items-center justify-center mb-4">
          <span className="text-warn text-xl">!</span>
        </div>
        <p className="text-sm text-text-secondary mb-2">Failed to load signals</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button onClick={() => setPage(page)} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          {SOURCES.map((source) => (
            <button
              key={source.value}
              onClick={() => setSelectedSource(source.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedSource === source.value
                  ? "bg-primary text-white"
                  : "bg-elevated/50 text-text-secondary hover:text-text-primary hover:bg-eleved"
              }`}
            >
              {source.value !== "all" ? (
                <SourcePill source={source.value as SourceType} />
              ) : (
                source.label
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button className="text-text-muted hover:text-text-primary text-xs flex items-center gap-1 px-2">
            <span className="text-sm">○</span>
            Pending
          </button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted animate-pulse">Loading signals…</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((signal, i) => (
                <motion.div
                  key={signal.id as string}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <SignalCard
                    id={signal.id as string}
                    source={signal.source as SourceType}
                    subject={(signal.raw_text as string).slice(0, 80)}
                    author={signal.author as string}
                    channel={signal.channel as string}
                    timestamp={signal.created_at as string}
                    classification={(signal.label || "pending") as "bug" | "feature" | "question" | "noise" | "duplicate"}
                    severity={(signal.urgency || "medium") as "critical" | "high" | "medium" | "low"}
                    status={signal.status as string}
                    isSelected={selectedSignal === signal.id}
                    onClick={() => setSelectedSignal(signal.id as string)}
                    isNew={i < 2}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {!loading && filtered.length === 0 && signals.length > 0 && selectedSource !== "all" && (
            <div className="text-center py-8">
              <p className="text-xs text-text-muted">No signals from this source.</p>
            </div>
          )}
          {!loading && data && data.total === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">No signals yet.</p>
              <p className="text-xs text-text-muted mt-1">Connect a source to start ingesting feedback.</p>
              <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">
                Connect Source
              </button>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => { setPage(p); setSelectedSignal(null); }} />
        )}
      </div>

      <SignalDetailPanel
        signalId={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onRunTriage={() => console.log("Run triage on", selectedSignal)}
      />
    </div>
  );
}
