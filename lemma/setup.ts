import lemmaClient from "../lib/lemma";
import { intakeAgentConfig } from "./agents/intake-agent";
import { classifierAgentConfig } from "./agents/classifier-agent";
import { triageAgentConfig } from "./agents/triage-agent";
import { writerAgentConfig } from "./agents/writer-agent";
import { classifyAndEmbedWorkflow } from "./workflows/classify-and-embed";
import { clusterFormationWorkflow } from "./workflows/cluster-formation";
import { triagePipelineWorkflow } from "./workflows/triage-pipeline";
import { releaseDigestWorkflow } from "./workflows/release-digest";
import { scheduleConfigs } from "./schedules";
import { ingestSlackSignal, ingestGithubSignal, createGithubIssue, postSlackSummary, generateEmbeddings, generateIdentifier } from "./functions/index";

const TABLE_SCHEMAS = {
  feedback_items: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    source: "text NOT NULL",
    source_id: "text",
    source_url: "text",
    raw_text: "text NOT NULL",
    author: "text",
    author_email: "text",
    channel: "text",
    timestamp: "timestamptz DEFAULT now()",
    label: "text",
    label_confidence: "float",
    urgency: "text",
    product_area: "text",
    embedding: "vector(1536)",
    cluster_id: "uuid",
    status: "text DEFAULT 'pending'",
    created_at: "timestamptz DEFAULT now()",
    updated_at: "timestamptz DEFAULT now()",
  },
  feedback_clusters: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    canonical_title: "text NOT NULL",
    canonical_summary: "text",
    product_area: "text",
    severity: "text",
    severity_score: "float",
    signal_count: "int DEFAULT 0",
    source_count: "int DEFAULT 0",
    sources: "text[]",
    first_seen: "timestamptz",
    last_seen: "timestamptz",
    root_cause_hypothesis: "text",
    affected_modules: "text[]",
    confidence: "float",
    release_risk: "text",
    status: "text DEFAULT 'open'",
    created_at: "timestamptz DEFAULT now()",
    updated_at: "timestamptz DEFAULT now()",
  },
  issue_drafts: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    cluster_id: "uuid",
    identifier: "text",
    title: "text NOT NULL",
    summary: "text",
    repro_steps: "text",
    expected_behavior: "text",
    actual_behavior: "text",
    suggested_owner: "text",
    labels: "text[]",
    title_confidence: "float",
    repro_confidence: "float",
    area_confidence: "float",
    severity: "text",
    release_risk: "text",
    release_risk_reason: "text",
    customer_reply_draft: "text",
    workflow_run_id: "text",
    approval_status: "text DEFAULT 'pending'",
    approved_by: "text",
    approved_at: "timestamptz",
    rejection_reason: "text",
    github_issue_number: "int",
    github_issue_url: "text",
    slack_message_ts: "text",
    slack_channel: "text",
    created_at: "timestamptz DEFAULT now()",
    updated_at: "timestamptz DEFAULT now()",
  },
  action_log: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    event_type: "text NOT NULL",
    entity_type: "text",
    entity_id: "uuid",
    actor: "text",
    metadata: "jsonb",
    workflow_run_id: "text",
    created_at: "timestamptz DEFAULT now()",
  },
  release_digests: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    generated_at: "timestamptz DEFAULT now()",
    overall_risk: "text",
    risk_score: "float",
    block_count: "int",
    caution_count: "int",
    safe_count: "int",
    digest_text: "text",
    slack_posted: "boolean DEFAULT false",
    slack_message_ts: "text",
    created_at: "timestamptz DEFAULT now()",
  },
};

export async function registerFunctions() {
  const functionConfigs = [
    { name: "ingest-slack-signal", handler: ingestSlackSignal.toString(), input_schema: { text: "string", user: "string", channel: "string", ts: "string" } },
    { name: "ingest-github-signal", handler: ingestGithubSignal.toString(), input_schema: { repo: "string", since: "string" } },
    { name: "create-github-issue", handler: createGithubIssue.toString(), input_schema: { draft_id: "string", repo: "string" } },
    { name: "post-slack-summary", handler: postSlackSummary.toString(), input_schema: { channel: "string", message_type: "string" } },
    { name: "generate-embeddings", handler: generateEmbeddings.toString(), input_schema: { feedback_item_id: "string" } },
    { name: "generate-identifier", handler: generateIdentifier.toString(), input_schema: { product_area: "string" } },
  ];

  for (const fn of functionConfigs) {
    await lemmaClient.functions.register(fn as any);
  }
}

export async function registerAgents() {
  await lemmaClient.agents.register(intakeAgentConfig);
  await lemmaClient.agents.register(classifierAgentConfig);
  await lemmaClient.agents.register(triageAgentConfig);
  await lemmaClient.agents.register(writerAgentConfig);
}

export async function registerWorkflows() {
  await lemmaClient.workflows.register(classifyAndEmbedWorkflow);
  await lemmaClient.workflows.register(clusterFormationWorkflow);
  await lemmaClient.workflows.register(triagePipelineWorkflow);
  await lemmaClient.workflows.register(releaseDigestWorkflow);
}

export async function registerSchedules() {
  for (const schedule of scheduleConfigs) {
    await lemmaClient.schedules.create(schedule);
  }
}

export async function initializePod() {
  await lemmaClient.initialize();

  for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
    await lemmaClient.tables.create(tableName, schema);
  }

  await registerFunctions();
  await registerAgents();
  await registerWorkflows();
  await registerSchedules();
}
