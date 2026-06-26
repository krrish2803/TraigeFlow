import type { EvidenceItem, Signal } from "../types";

export interface SimilarityInput {
  signal: Signal;
  allSignals: Signal[];
}

export interface SimilarityOutput {
  similarSignals: Array<{ signalId: string; score: number; reason: string }>;
  shouldCluster: boolean;
  existingClusterId: string | null;
  evidence: EvidenceItem[];
}

function computeSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const bWords = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let intersection = 0;
  aWords.forEach((w) => {
    if (bWords.has(w)) intersection++;
  });
  const union = aWords.size + bWords.size - intersection;
  return union > 0 ? intersection / union : 0;
}

const BOOST_TERMS: Record<string, string[]> = {
  auth: ["login", "signin", "oauth", "password", "auth", "session"],
  payments: ["payment", "checkout", "charge", "billing", "refund", "paid"],
  onboarding: ["onboard", "setup", "welcome", "step", "signup", "register"],
  ui: ["ui", "button", "layout", "css", "render", "blank", "screen"],
  api: ["api", "endpoint", "timeout", "integration", "webhook"],
  performance: ["slow", "lag", "memory", "perform", "timeout"],
};

function getRelevantTerms(text: string): string[] {
  const lower = text.toLowerCase();
  for (const [, terms] of Object.entries(BOOST_TERMS)) {
    if (terms.some((t) => lower.includes(t))) return terms;
  }
  return [];
}

export function runSimilarityAgent(input: SimilarityInput): SimilarityOutput {
  const { signal, allSignals } = input;
  const evidence: EvidenceItem[] = [];
  const similarSignals: Array<{ signalId: string; score: number; reason: string }> = [];

  const signalTerms = getRelevantTerms(signal.body);

  for (const other of allSignals) {
    if (other.id === signal.id) continue;
    if (other.status === "noise") continue;

    let score = computeSimilarity(signal.body, other.body);
    if (score === 0) continue;

    if (signal.source === other.source) score += 0.05;
    if (signal.productArea && other.productArea && signal.productArea === other.productArea) score += 0.1;

    const otherTerms = getRelevantTerms(other.body);
    const sharedTerms = signalTerms.filter((t) => otherTerms.includes(t));
    if (sharedTerms.length > 0) score += 0.1 * sharedTerms.length;

    score = Math.min(score, 1);

    if (score > 0.15) {
      const reason = sharedTerms.length > 0
        ? `Shared keywords: ${sharedTerms.join(", ")}`
        : `Text similarity score: ${Math.round(score * 100)}%`;
      similarSignals.push({ signalId: other.id, score, reason });
    }
  }

  similarSignals.sort((a, b) => b.score - a.score);

  const highSimilarity = similarSignals.filter((s) => s.score > 0.3);
  const existingClusterId = highSimilarity.length > 0
    ? allSignals.find((s) => s.id === highSimilarity[0].signalId)?.relatedClusterId ?? null
    : null;

  for (const match of highSimilarity.slice(0, 3)) {
    evidence.push({
      type: "similarity_match",
      description: `Found similar signal (${Math.round(match.score * 100)}% match)`,
      confidence: match.score,
      details: match.reason,
    });
  }

  if (highSimilarity.length === 0) {
    evidence.push({
      type: "similarity_scan",
      description: "No closely similar signals found — may form new cluster",
      confidence: 0.6,
      details: `Scanned ${allSignals.length - 1} other signals, highest similarity was ${similarSignals.length > 0 ? `${Math.round(similarSignals[0].score * 100)}%` : "0%"}`,
    });
  }

  return {
    similarSignals: similarSignals.slice(0, 5),
    shouldCluster: highSimilarity.length > 0 || signal.body.split(/\s+/).length > 10,
    existingClusterId,
    evidence,
  };
}
