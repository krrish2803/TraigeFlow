import lemmaClient from "../../lib/lemma";

export async function ingestSlackSignal(input: {
  text: string;
  user: string;
  channel: string;
  ts: string;
  thread_ts?: string;
}) {
  const existing = await lemmaClient.datastore.query(
    `SELECT id FROM feedback_items WHERE source = 'slack' AND source_id = $1`,
    [input.ts]
  );
  if (existing.rows.length > 0) return { skipped: true };

  if (input.text.length < 15) return { skipped: true, reason: "too_short" };
  if (input.user.startsWith("B")) return { skipped: true, reason: "bot_message" };

  const record = await lemmaClient.records.create("feedback_items", {
    source: "slack",
    source_id: input.ts,
    source_url: `https://slack.com/archives/${input.channel}/p${input.ts.replace(".", "")}`,
    raw_text: input.text,
    author: input.user,
    channel: input.channel,
    status: "pending",
  });

  await lemmaClient.records.create("action_log", {
    event_type: "signal_ingested",
    entity_type: "feedback_item",
    entity_id: record.id,
    actor: "system",
    metadata: { source: "slack", channel: input.channel },
  });

  await lemmaClient.workflows.start("classify-and-embed", {
    feedback_item_id: record.id,
  });

  return { success: true, record_id: record.id };
}
