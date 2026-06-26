"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ActivityFeed from "@/components/activity/ActivityFeed";
import { useDashboard } from "@/lib/use-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const trendData = [
  { day: "Mon", signals: 12, clusters: 3, drafts: 1 },
  { day: "Tue", signals: 8, clusters: 2, drafts: 0 },
  { day: "Wed", signals: 15, clusters: 5, drafts: 2 },
  { day: "Thu", signals: 10, clusters: 4, drafts: 1 },
  { day: "Fri", signals: 6, clusters: 1, drafts: 0 },
  { day: "Sat", signals: 3, clusters: 0, drafts: 0 },
  { day: "Sun", signals: 9, clusters: 3, drafts: 1 },
];

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    await refresh();
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-elevated/30 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-elevated/30 animate-pulse max-w-3xl mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-warn/10 flex items-center justify-center mb-4">
          <span className="text-warn text-xl">!</span>
        </div>
        <p className="text-sm text-text-secondary mb-2">Failed to load dashboard</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const isEmpty = data && data.totalSignals === 0 && data.totalClusters === 0;

  return (
    <div className="space-y-6">
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-elevated/40 border border-border border-dashed rounded-xl p-6 text-center"
        >
          <p className="text-sm text-text-secondary mb-3">No data yet. Load demo data to explore all features, or inject signals from Settings.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {seeding ? "Loading…" : "Load Demo Data"}
            </button>
          </div>
        </motion.div>
      )}

      {!isEmpty && data && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Signals" value={data.totalSignals} trend={data.pendingSignals} trendLabel="pending" />
            <MetricCard label="Clusters" value={data.totalClusters} trend={data.criticalClusters} trendLabel="critical" />
            <MetricCard label="Drafts" value={data.totalDrafts} trend={data.pendingDrafts} trendLabel="unreviewed" />
            <MetricCard label="Risk Score" value={`${data.riskScore}%`} trend={0} trendLabel="" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-surface border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Weekly Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="signalsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2d2d3d", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="signals" stroke="#3b82f6" fill="url(#signalsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Recent Drafts</h3>
              {data.recentDrafts && data.recentDrafts.length > 0 ? (
                <div className="space-y-2">
                  {data.recentDrafts.map((draft) => (
                    <div key={draft.id as string} className="border-b border-border pb-2 last:border-0">
                      <p className="text-sm text-text-primary truncate">{(draft.title as string) || "Untitled"}</p>
                      <p className="text-xs text-text-muted">{(draft.ownerSuggestion as string) || (draft.suggested_owner as string) || "Unknown"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No drafts yet.</p>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Recent Activity</h3>
            <ActivityFeed
              activities={
                data.recentActivity?.map((a) => ({
                  id: a.id as string,
                  action: a.description as string || a.action as string,
                  target: (a.metadata as Record<string, unknown>)?.identifier as string || "",
                  timestamp: a.timestamp as string || a.created_at as string || a.createdAt as string,
                  actor: a.actor as string || "System",
                  icon: a.type === "error" ? "✕" : a.type === "draft_created" ? "⊟" : a.type === "draft_approved" ? "✓" : "○",
                })) || []
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend, trendLabel }: { label: string; value: string | number; trend: number; trendLabel: string }) {
  const trendColor = trend > 0 ? "text-warn" : "text-success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-4"
    >
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {trendLabel && (
        <p className={`text-xs mt-1 ${trendColor}`}>
          {trend} {trendLabel}
        </p>
      )}
    </motion.div>
  );
}
