"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { injectDemoSignal, injectCustomSignal } from "@/lib/use-data";
import { useToast } from "@/components/ui/Toast";

const INTEGRATIONS = [
  { name: "Slack", icon: "S", color: "#4A154B", status: "connected" as const, detail: "Workspace: acme-corp", channel: "#bugs" },
  { name: "Gmail", icon: "G", color: "#EA4335", status: "connected" as const, detail: "ayush@gappy.ai", channel: "Support Inbox" },
  { name: "GitHub", icon: "Gh", color: "#24292E", status: "connected" as const, detail: "acme/backend-repo", channel: "Issues" },
  { name: "Jira", icon: "J", color: "#0052CC", status: "disconnected" as const, detail: "Not connected", channel: "" },
];

const DEMO_SCENARIOS = [
  { id: "slack-login-crash", label: "Slack: iOS Login Crash", desc: "iPhone login crash after tapping button" },
  { id: "gmail-payment-fail", label: "Gmail: Payment Timeout", desc: "Payment request keeps timing out" },
  { id: "slack-onboarding-blank", label: "Slack: Onboarding Blank", desc: "Onboarding step 3 blank on iPad" },
  { id: "github-api-timeout", label: "GitHub: API Timeout", desc: "API gateway returning 504 during peak" },
  { id: "gmail-dark-mode", label: "Gmail: Feature Request", desc: "Dark mode feature request" },
  { id: "slack-auth-broken", label: "Slack: OAuth Broken", desc: "OAuth completely broken, no one can sign in" },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const [injecting, setInjecting] = useState<string | null>(null);
  const [customSource, setCustomSource] = useState("slack");
  const [customBody, setCustomBody] = useState("");
  const [customAuthor, setCustomAuthor] = useState("demo-user");
  const [showCustom, setShowCustom] = useState(false);

  const handleInject = async (scenarioId: string) => {
    setInjecting(scenarioId);
    try {
      const result = await injectDemoSignal(scenarioId);
      if (result.ok) {
        showToast(`Signal injected: ${result.signal.title}`, "success");
      } else {
        showToast("Failed to inject signal", "error");
      }
    } catch {
      showToast("Failed to inject signal", "error");
    }
    setInjecting(null);
  };

  const handleCustomInject = async () => {
    if (!customBody.trim()) return;
    setInjecting("custom");
    try {
      const result = await injectCustomSignal({
        source: customSource,
        body: customBody,
        author: customAuthor,
      });
      if (result.ok) {
        showToast("Custom signal injected", "success");
        setCustomBody("");
      }
    } catch {
      showToast("Failed to inject signal", "error");
    }
    setInjecting(null);
  };

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 gap-4">
        {INTEGRATIONS.map((integration, i) => (
          <motion.div
            key={integration.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-xl bg-surface border border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: integration.color }}>
                  {integration.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-display font-semibold text-text-primary">{integration.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${integration.status === "connected" ? "bg-success animate-pulse" : "bg-text-muted"}`} />
                      <span className={`text-xs ${integration.status === "connected" ? "text-success" : "text-text-muted"}`}>
                        {integration.status === "connected" ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{integration.detail}{integration.channel ? ` · ${integration.channel}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.status === "connected" ? (
                  <>
                    <button className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-elevated/50">Configure</button>
                    <button className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-secondary">Disconnect</button>
                  </>
                ) : (
                  <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90">Connect</button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-5 rounded-xl bg-surface border border-border"
      >
        <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Triage Rules</h3>
        <div className="space-y-3">
          {[
            { label: "Auto-classify bugs from Slack #bugs", enabled: true },
            { label: "Escalate CRITICAL severity to on-call", enabled: true },
            { label: "Auto-merge duplicate signals", enabled: false },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-text-primary">{rule.label}</span>
              <button className={`w-9 h-5 rounded-full transition-colors relative ${rule.enabled ? "bg-primary" : "bg-border"}`}>
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                  animate={{ left: rule.enabled ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-5 rounded-xl bg-surface border border-border"
      >
        <h3 className="text-sm font-display font-semibold text-text-primary mb-1">Demo Mode</h3>
        <p className="text-xs text-text-secondary mb-4">Inject pre-defined complaint scenarios to test the full pipeline.</p>

        <div className="grid grid-cols-2 gap-3">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleInject(scenario.id)}
              disabled={injecting === scenario.id}
              className="p-3 rounded-lg border border-border bg-elevated/20 hover:bg-elevated/50 transition-all text-left disabled:opacity-50"
            >
              <span className="text-xs font-medium text-text-primary block">{scenario.label}</span>
              <span className="text-[10px] text-text-muted mt-0.5 block">{scenario.desc}</span>
              {injecting === scenario.id && <span className="text-[10px] text-primary mt-1 block">Injecting…</span>}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
          >
            {showCustom ? "▼" : "▶"} Custom Signal
          </button>
          {showCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 space-y-3"
            >
              <select
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-elevated/50 border border-border text-sm text-text-primary"
              >
                <option value="slack">Slack</option>
                <option value="gmail">Gmail</option>
                <option value="github">GitHub</option>
              </select>
              <input
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="Author"
                className="w-full px-3 py-2 rounded-lg bg-elevated/50 border border-border text-sm text-text-primary placeholder-text-muted"
              />
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Describe the issue…"
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-elevated/50 border border-border text-sm text-text-primary placeholder-text-muted resize-none"
              />
              <button
                onClick={handleCustomInject}
                disabled={injecting === "custom" || !customBody.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {injecting === "custom" ? "Injecting…" : "Inject Custom Signal"}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
