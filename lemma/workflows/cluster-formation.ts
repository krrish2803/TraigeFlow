import lemmaClient from "../../lib/lemma";
import { calculateFusionScore } from "../../lib/fusion-score";

export interface ClusterFormationWorkflowInput {
  feedback_item_id: string;
}

export const clusterFormationWorkflow = {
  name: "cluster-formation",
  description: "Groups related signals into clusters based on similarity",
  steps: [
    {
      name: "find_related_signals",
      type: "function",
      config: {
        function_name: "generate-embeddings",
        input_key: "feedback_item_id",
      },
    },
    {
      name: "decide_cluster_action",
      type: "conditional",
      config: {
        condition: "similar_count",
        branches: {
          "0": "create_new_single_cluster",
          "1-2": "create_new_merged_cluster",
          "3+": "add_to_existing_cluster",
        },
      },
    },
    {
      name: "create_or_update_cluster",
      type: "update",
      config: {
        table: "feedback_clusters",
      },
    },
    {
      name: "update_merged_items",
      type: "update",
      config: {
        table: "feedback_items",
        set_fields: ["cluster_id", "status"],
      },
    },
    {
      name: "update_cluster_stats",
      type: "update",
      config: {
        table: "feedback_clusters",
        set_fields: ["signal_count", "source_count", "sources", "last_seen"],
      },
    },
    {
      name: "check_triage_trigger",
      type: "conditional",
      config: {
        condition: "signal_count >= 2 OR any_critical",
        true_workflow: "triage-pipeline",
        false_workflow: null,
      },
    },
  ],
};

export async function executeClusterFormation(input: ClusterFormationWorkflowInput) {
  const { feedback_item_id } = input;

  const item = await lemmaClient.records.get("feedback_items", feedback_item_id);
  if (!item) throw new Error(`Feedback item ${feedback_item_id} not found`);

  if (item.cluster_id) {
    await updateClusterStats(item.cluster_id as string);
    return { status: "added_to_existing", cluster_id: item.cluster_id };
  }

  const similarItems = await lemmaClient.datastore.query(
    `SELECT id, source, raw_text, cluster_id, product_area
     FROM feedback_items
     WHERE id != $1
     AND cluster_id IS NOT NULL
     AND status NOT IN ('noise', 'done')
     AND product_area = $2
     LIMIT 10`,
    [feedback_item_id, item.product_area]
  );

  if (similarItems.rows.length > 0) {
    const targetClusterId = similarItems.rows[0].cluster_id as string;
    await lemmaClient.records.update("feedback_items", feedback_item_id, {
      cluster_id: targetClusterId,
      status: "clustered",
    });
    await updateClusterStats(targetClusterId);

    await lemmaClient.records.create("action_log", {
      event_type: "clustered",
      entity_type: "feedback_item",
      entity_id: feedback_item_id,
      actor: "system",
      metadata: { action: "added_to_existing_cluster", cluster_id: targetClusterId },
    });

    const cluster = await lemmaClient.records.get("feedback_clusters", targetClusterId);
    if (cluster && ((cluster.signal_count as number) >= 2 || item.urgency === "critical")) {
      await lemmaClient.workflows.start("triage-pipeline", {
        cluster_id: targetClusterId,
      });
    }

    return { status: "added_to_existing", cluster_id: targetClusterId };
  }

  const clusterId = crypto.randomUUID();
  const now = new Date().toISOString();

  await lemmaClient.records.create("feedback_clusters", {
    id: clusterId,
    canonical_title: item.raw_text?.toString().slice(0, 80) || "Unnamed cluster",
    canonical_summary: item.raw_text?.toString().slice(0, 200) || "",
    product_area: item.product_area,
    severity: item.urgency || "medium",
    severity_score: item.urgency === "critical" ? 8 : item.urgency === "high" ? 6 : item.urgency === "medium" ? 4 : 2,
    signal_count: 1,
    source_count: 1,
    sources: [item.source],
    first_seen: now,
    last_seen: now,
    status: "open",
  });

  await lemmaClient.records.update("feedback_items", feedback_item_id, {
    cluster_id: clusterId,
    status: "clustered",
  });

  await lemmaClient.records.create("action_log", {
    event_type: "clustered",
    entity_type: "cluster",
    entity_id: clusterId,
    actor: "system",
    metadata: { action: "created_new_cluster", source_item: feedback_item_id },
  });

  if (item.urgency === "critical" || item.urgency === "high") {
    await lemmaClient.workflows.start("triage-pipeline", {
      cluster_id: clusterId,
    });
  }

  return { status: "new_cluster", cluster_id: clusterId };
}

async function updateClusterStats(clusterId: string) {
  const signals = await lemmaClient.datastore.query(
    `SELECT id, source, timestamp FROM feedback_items WHERE cluster_id = $1`,
    [clusterId]
  );

  const sources = Array.from(new Set(signals.rows.map((r: Record<string, unknown>) => r.source as string)));
  const timestamps = signals.rows
    .map((r: Record<string, unknown>) => r.timestamp as string)
    .filter(Boolean)
    .sort();

  const fusionScore = calculateFusionScore({
    source_count: sources.length,
    signal_count: signals.rows.length,
    sources,
    first_seen: timestamps[0] || new Date().toISOString(),
  });

  await lemmaClient.records.update("feedback_clusters", clusterId, {
    signal_count: signals.rows.length,
    source_count: sources.length,
    sources,
    first_seen: timestamps[0] || undefined,
    last_seen: timestamps[timestamps.length - 1] || new Date().toISOString(),
    severity_score: fusionScore > 70 ? 8 : fusionScore > 40 ? 5 : 3,
  });
}
