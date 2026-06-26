export const writerAgentConfig = {
  name: "writer_agent",
  description: "Drafts structured engineering tickets and stakeholder communications",
  model: "claude-sonnet-4-6",
  system_prompt: `You are the Writer Agent for Feedback-to-Fix Operator.

You receive a fully triaged cluster with root cause analysis and must produce three outputs:

1. GITHUB ISSUE DRAFT: A complete, professional engineering ticket
   - Title: Concise, specific, starts with the affected area in brackets: "[Auth] OAuth token race condition causes login crash"
   - Summary: 2-3 sentences describing the problem from an engineering perspective
   - Steps to Reproduce: Numbered list, specific enough for any engineer to follow
   - Expected Behavior: What should happen
   - Actual Behavior: What actually happens, with any error details
   - Suggested Owner: Based on the affected module, suggest a team area (not a name)
   - Labels: Array of relevant labels

2. CUSTOMER REPLY DRAFT: A professional, empathetic response for the support team
   - Acknowledge the issue
   - Confirm it's been logged
   - Give an estimated timeline based on severity
   - 3-5 sentences max

3. SLACK SUMMARY: One-paragraph summary for the engineering Slack channel
   - What the problem is
   - How many users affected / how widespread
   - What's being done
   - Professional but informal tone

Output ONLY valid JSON:
{
  "issue": {
    "title": string,
    "summary": string,
    "repro_steps": string,
    "expected_behavior": string,
    "actual_behavior": string,
    "suggested_owner_area": string,
    "labels": string[]
  },
  "customer_reply": string,
  "slack_summary": string,
  "confidence_scores": {
    "title": number,
    "repro_steps": number,
    "root_cause": number
  }
}`,
  tools: ["generate-identifier"],
  input_schema: {
    cluster_id: "string",
    triage_result: "object",
    signals: "array",
  },
};

export interface WriterInput {
  clusterId: string;
  triageResult: {
    root_cause_hypothesis: string;
    severity_score: number;
    severity: string;
    release_risk: string;
    release_risk_reason: string;
    affected_modules: string[];
    confidence: number;
  };
  signals: Array<{
    source: string;
    raw_text: string;
    author: string;
    channel: string;
  }>;
  label?: string;
  product_area?: string;
}

export interface WriterOutput {
  issue: {
    title: string;
    summary: string;
    repro_steps: string;
    expected_behavior: string;
    actual_behavior: string;
    suggested_owner_area: string;
    labels: string[];
  };
  customer_reply: string;
  slack_summary: string;
  confidence_scores: {
    title: number;
    repro_steps: number;
    root_cause: number;
  };
}

export function runWriterAgent(input: WriterInput): WriterOutput {
  const { triageResult, signals, product_area } = input;
  const area = product_area || "core";
  const areaUpper = area.charAt(0).toUpperCase() + area.slice(1);

  const areaPrefix = area === "auth" ? "[Auth]" :
    area === "payments" ? "[Payments]" :
    area === "onboarding" ? "[Onboarding]" :
    area === "ui" ? "[UI]" :
    area === "api" ? "[API]" :
    area === "performance" ? "[Performance]" : "[Bug]";

  const title = `${areaPrefix} ${triageResult.root_cause_hypothesis.split(" — ")[0] || triageResult.root_cause_hypothesis}`;

  const signalCount = signals.length;
  const sourceTypes = Array.from(new Set(signals.map((s) => s.source)));

  const summary = `${signalCount} user reports across ${sourceTypes.length} sources (${sourceTypes.join(", ")}) describe ${triageResult.root_cause_hypothesis.toLowerCase()}. ${triageResult.severity_score >= 7 ? "This is affecting a significant portion of users and requires immediate attention." : "The issue is reproducible and should be addressed in the current cycle."}`;

  const reproSteps = signals
    .filter((s) => s.source === "github" || s.raw_text.length > 100)
    .slice(0, 1)
    .map((s) => {
      const lines = s.raw_text.split("\n").filter((l) => /^\d+\.|step/i.test(l));
      return lines.length > 0 ? lines.join("\n") : "1. Navigate to the affected area\n2. Perform the action described\n3. Observe the unexpected behavior";
    })
    .join("\n") || "1. Navigate to the affected area\n2. Perform the action described\n3. Observe the unexpected behavior";

  return {
    issue: {
      title,
      summary,
      repro_steps: reproSteps,
      expected_behavior: "The system should operate normally without errors or degradation in user experience.",
      actual_behavior: `Users experience ${triageResult.severity === "critical" ? "a complete failure" : triageResult.severity === "high" ? "significant degradation" : "unexpected behavior"}. ${triageResult.root_cause_hypothesis}`,
      suggested_owner_area: triageResult.affected_modules[0]?.split("/")[0] || area,
      labels: [
        triageResult.severity,
        triageResult.release_risk === "block" ? "release-blocker" : null,
        ...(signals.length >= 3 ? ["multiple-reports"] : []),
        ...(sourceTypes.length >= 2 ? ["cross-source"] : []),
      ].filter(Boolean) as string[],
    },
    customer_reply: `Thank you for reporting this issue. We've logged it in our engineering system as ${title} and our team is investigating. ${triageResult.severity === "critical" ? "Given the severity, we are prioritizing this as a critical fix and expect an update within 24 hours." : triageResult.severity === "high" ? "Our team is actively working on this and we expect to have a fix in the next release." : "We've added this to our backlog and will address it in an upcoming sprint."} We'll update you as soon as we have more information.`,
    slack_summary: `🚨 *${title}*\n${signalCount} reports across ${sourceTypes.length} channels. ${triageResult.release_risk === "block" ? "This is a release blocker." : triageResult.release_risk === "caution" ? "Should be monitored closely." : "Low risk, can ship."} Root cause: ${triageResult.root_cause_hypothesis}. ${triageResult.affected_modules.length > 0 ? `Affects: ${triageResult.affected_modules.join(", ")}.` : ""}`,
    confidence_scores: {
      title: triageResult.confidence >= 0.8 ? 0.92 : triageResult.confidence >= 0.6 ? 0.78 : 0.55,
      repro_steps: signals.filter((s) => s.source === "github" || s.raw_text.includes("step")).length > 0 ? 0.88 : 0.62,
      root_cause: triageResult.confidence,
    },
  };
}
