export const SOURCE_CONFIG = {
  slack: { label: "Slack", color: "#4A154B", icon: "S" },
  gmail: { label: "Gmail", color: "#EA4335", icon: "G" },
  github: { label: "GitHub", color: "#24292E", icon: "Gh" },
  jira: { label: "Jira", color: "#0052CC", icon: "J" },
} as const;

export type SourceType = keyof typeof SOURCE_CONFIG;

export const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", color: "var(--accent-secondary)", bg: "rgba(255,107,107,0.2)" },
  high: { label: "HIGH", color: "var(--accent-warn)", bg: "rgba(255,179,71,0.2)" },
  medium: { label: "MEDIUM", color: "var(--accent-primary)", bg: "rgba(108,99,255,0.2)" },
  low: { label: "LOW", color: "var(--text-muted)", bg: "rgba(68,68,90,0.2)" },
} as const;

export type SeverityLevel = keyof typeof SEVERITY_CONFIG;

export const CLASSIFICATION_CONFIG = {
  bug: { label: "BUG", color: "var(--accent-secondary)" },
  feature: { label: "FEATURE", color: "var(--accent-primary)" },
  question: { label: "QUESTION", color: "var(--accent-warn)" },
  noise: { label: "NOISE", color: "var(--text-muted)" },
  duplicate: { label: "DUPLICATE", color: "#666" },
} as const;

export type ClassificationType = keyof typeof CLASSIFICATION_CONFIG;

export const AGENTS = ["intake", "classify", "retrieve", "triage", "review", "ship"] as const;
export type AgentName = (typeof AGENTS)[number];

export const AGENT_LABELS: Record<AgentName, string> = {
  intake: "Intake",
  classify: "Classify",
  retrieve: "Retrieve",
  triage: "Triage",
  review: "Review",
  ship: "Ship",
};

