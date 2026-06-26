import lemmaClient from "../../lib/lemma";
import { runIntakeAgent } from "../agents/intake-agent";
import { runClassifierAgent } from "../agents/classifier-agent";

export interface ClassifyAndEmbedWorkflowInput {
  feedback_item_id: string;
}

export const classifyAndEmbedWorkflow = {
  name: "classify-and-embed",
  description: "Ingests, cleans, classifies, and embeds a new feedback signal",
  steps: [
    {
      name: "run_intake_agent",
      type: "agent",
      config: {
        agent_name: "intake_agent",
        input_key: "feedback_item_id",
      },
    },
    {
      name: "generate_embeddings",
      type: "function",
      config: {
        function_name: "generate-embeddings",
        input_key: "feedback_item_id",
      },
    },
    {
      name: "run_classifier_agent",
      type: "agent",
      config: {
        agent_name: "classifier_agent",
        input_key: "feedback_item_id",
      },
    },
    {
      name: "update_feedback_item",
      type: "update",
      config: {
        table: "feedback_items",
        set_fields: ["label", "urgency", "product_area", "status"],
      },
    },
    {
      name: "check_duplicate_cluster",
      type: "conditional",
      config: {
        condition: "similar_items_exist",
        true_workflow: "assign-to-cluster",
        false_workflow: "cluster-formation",
      },
    },
    {
      name: "log_action",
      type: "log",
      config: {
        event_type: "classified",
      },
    },
  ],
};

export async function executeClassifyAndEmbed(input: ClassifyAndEmbedWorkflowInput) {
  const { feedback_item_id } = input;

  const intakeResult = await runIntakeAgent(feedback_item_id);

  if (intakeResult.type === "noise") {
    await lemmaClient.records.update("feedback_items", feedback_item_id, {
      label: "noise",
      status: "noise",
    });
    await lemmaClient.records.create("action_log", {
      event_type: "classified",
      entity_type: "feedback_item",
      entity_id: feedback_item_id,
      actor: "intake_agent",
      metadata: { label: "noise", reason: intakeResult.noise_reason },
    });
    return { status: "noise", reason: intakeResult.noise_reason };
  }

  const embeddingResult = await (await import("../functions/generate-embeddings"))
    .generateEmbeddings({ feedback_item_id }) as unknown as {
      success: boolean;
      similar_count: number;
      similar_items: Array<Record<string, unknown>>;
    };

  const classifierResult = runClassifierAgent(
    intakeResult.cleaned_text,
    (await lemmaClient.records.get("feedback_items", feedback_item_id))?.source as string || "unknown"
  );

  await lemmaClient.records.update("feedback_items", feedback_item_id, {
    label: classifierResult.label,
    label_confidence: classifierResult.classification_confidence,
    urgency: classifierResult.urgency,
    product_area: classifierResult.product_area,
    status: "classified",
  });

  await lemmaClient.records.create("action_log", {
    event_type: "classified",
    entity_type: "feedback_item",
    entity_id: feedback_item_id,
    actor: "classifier_agent",
    metadata: {
      label: classifierResult.label,
      urgency: classifierResult.urgency,
      product_area: classifierResult.product_area,
    },
  });

  if (embeddingResult.success && (embeddingResult.similar_count as number) > 0) {
    const similarWithCluster = embeddingResult.similar_items.filter(
      (item: Record<string, unknown>) => item.cluster_id
    );

    if (similarWithCluster.length > 0) {
      const clusterId = similarWithCluster[0].cluster_id;
      await lemmaClient.records.update("feedback_items", feedback_item_id, {
        cluster_id: clusterId,
        status: "clustered",
      });

      await lemmaClient.workflows.start("cluster-formation", {
        feedback_item_id,
      });
    } else {
      await lemmaClient.workflows.start("cluster-formation", {
        feedback_item_id,
      });
    }
  } else {
    await lemmaClient.workflows.start("cluster-formation", {
      feedback_item_id,
    });
  }

  return {
    status: "classified",
    label: classifierResult.label,
    urgency: classifierResult.urgency,
    product_area: classifierResult.product_area,
    similar_count: embeddingResult.similar_count,
  };
}
