import lemmaClient from "../../lib/lemma";
import { runTriageAgent, TriageInput, TriageOutput } from "../agents/triage-agent";
import { runWriterAgent, WriterInput, WriterOutput } from "../agents/writer-agent";
import { generateIdentifier } from "../functions/generate-identifier";

export interface TriagePipelineWorkflowInput {
  cluster_id: string;
}

export const triagePipelineWorkflow = {
  name: "triage-pipeline",
  description: "Takes a cluster from classified signals to approved GitHub issue",
  steps: [
    {
      name: "fetch_cluster_and_signals",
      type: "function",
      config: {
        function_name: "fetch-cluster-context",
        input_key: "cluster_id",
      },
    },
    {
      name: "run_triage_agent",
      type: "agent",
      config: {
        agent_name: "triage_agent",
        input_key: "cluster_data",
      },
    },
    {
      name: "update_cluster_with_triage",
      type: "update",
      config: {
        table: "feedback_clusters",
        set_fields: ["root_cause_hypothesis", "severity", "severity_score", "release_risk", "affected_modules", "confidence"],
      },
    },
    {
      name: "run_writer_agent",
      type: "agent",
      config: {
        agent_name: "writer_agent",
        input_key: "triage_result",
      },
    },
    {
      name: "generate_identifier",
      type: "function",
      config: {
        function_name: "generate-identifier",
        input_key: "product_area",
      },
    },
    {
      name: "create_draft",
      type: "update",
      config: {
        table: "issue_drafts",
        status: "pending",
      },
    },
    {
      name: "human_review_wait",
      type: "wait",
      config: {
        wait_type: "human_approval",
        assign_to: "pod_member",
        timeout_hours: 72,
      },
    },
    {
      name: "handle_approval",
      type: "conditional",
      config: {
        condition: "approved",
        true_steps: ["create_github_issue", "post_slack_summary", "mark_approved"],
        false_steps: ["mark_rejected"],
      },
    },
  ],
};

export async function executeTriagePipeline(input: TriagePipelineWorkflowInput) {
  const { cluster_id } = input;

  const cluster = await lemmaClient.records.get("feedback_clusters", cluster_id);
  if (!cluster) throw new Error(`Cluster ${cluster_id} not found`);

  const signals = await lemmaClient.datastore.query(
    `SELECT id, source, source_url, raw_text, author, channel, label, urgency, product_area
     FROM feedback_items WHERE cluster_id = $1 AND status != 'noise'`,
    [cluster_id]
  );

  const pastClusters = await lemmaClient.files.search({
    query: (cluster.canonical_title as string) || "",
    namespace: "POD",
    limit: 3,
  });

  const triageInput: TriageInput = {
    clusterId: cluster_id,
    signals: signals.rows as TriageInput["signals"],
    similarPastClusters: pastClusters.files.map((f) => {
      const parsed = tryParseContent(f.content);
      return parsed ? { title: f.name, root_cause_hypothesis: parsed.root_cause_hypothesis || "", severity: parsed.severity || "" } : null;
    }).filter(Boolean) as TriageInput["similarPastClusters"],
  };

  const triageOutput: TriageOutput = runTriageAgent(triageInput);

  await lemmaClient.records.update("feedback_clusters", cluster_id, {
    root_cause_hypothesis: triageOutput.root_cause_hypothesis,
    severity: triageOutput.severity,
    severity_score: triageOutput.severity_score,
    release_risk: triageOutput.release_risk,
    affected_modules: triageOutput.affected_modules,
    confidence: triageOutput.confidence,
    status: "draft_generated",
  });

  const firstSignal = signals.rows[0] as Record<string, unknown> | undefined;
  const writerInput: WriterInput = {
    clusterId: cluster_id,
    triageResult: triageOutput,
    signals: signals.rows as WriterInput["signals"],
    label: (firstSignal?.label as string) || "bug",
    product_area: (firstSignal?.product_area as string) || (cluster.product_area as string) || "core_product",
  };

  const writerOutput: WriterOutput = runWriterAgent(writerInput);

  const idResult = await generateIdentifier({
    product_area: writerInput.product_area || "core",
  });

  const workflowRunId = crypto.randomUUID();
  const draft = await lemmaClient.records.create("issue_drafts", {
    cluster_id,
    identifier: idResult.identifier,
    title: writerOutput.issue.title,
    summary: writerOutput.issue.summary,
    repro_steps: writerOutput.issue.repro_steps,
    expected_behavior: writerOutput.issue.expected_behavior,
    actual_behavior: writerOutput.issue.actual_behavior,
    suggested_owner: writerOutput.issue.suggested_owner_area,
    labels: writerOutput.issue.labels,
    title_confidence: writerOutput.confidence_scores.title,
    repro_confidence: writerOutput.confidence_scores.repro_steps,
    area_confidence: writerOutput.confidence_scores.root_cause,
    severity: triageOutput.severity,
    release_risk: triageOutput.release_risk,
    release_risk_reason: triageOutput.release_risk_reason,
    customer_reply_draft: writerOutput.customer_reply,
    workflow_run_id: workflowRunId,
    approval_status: "pending",
  });

  await lemmaClient.records.create("action_log", {
    event_type: "draft_created",
    entity_type: "draft",
    entity_id: draft.id,
    actor: "writer_agent",
    metadata: {
      cluster_id,
      identifier: idResult.identifier,
      severity: triageOutput.severity,
      release_risk: triageOutput.release_risk,
    },
    workflow_run_id: workflowRunId,
  });

  await lemmaClient.files.create({
    name: `triage-${cluster_id}.md`,
    content: formatClusterSummary(cluster, triageOutput, writerOutput),
    namespace: "POD",
  });

  return {
    status: "awaiting_approval",
    draft_id: draft.id,
    identifier: idResult.identifier,
    triage: triageOutput,
    writer: writerOutput,
  };
}

function tryParseContent(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function formatClusterSummary(
  cluster: Record<string, unknown>,
  triage: TriageOutput,
  writer: WriterOutput
): string {
  return [
    `# ${writer.issue.title}`,
    ``,
    `**Cluster ID:** ${cluster.id}`,
    `**Severity:** ${triage.severity?.toUpperCase()} (${triage.severity_score}/10)`,
    `**Release Risk:** ${triage.release_risk?.toUpperCase()}`,
    `**Confidence:** ${(triage.confidence * 100).toFixed(0)}%`,
    ``,
    `## Root Cause Hypothesis`,
    triage.root_cause_hypothesis,
    ``,
    `## Affected Modules`,
    ...triage.affected_modules.map((m) => `- ${m}`),
    ``,
    `## Analysis Notes`,
    triage.analysis_notes,
  ].join("\n");
}
