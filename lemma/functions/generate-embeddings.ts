import lemmaClient from "../../lib/lemma";

export async function generateEmbeddings(input: {
  feedback_item_id: string;
}) {
  const item = await lemmaClient.records.get("feedback_items", input.feedback_item_id);
  if (!item) throw new Error("Item not found");

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) return { success: false, reason: "no_openai_key" };

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: item.raw_text as string,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const data = await response.json();
  const embedding = data.data[0].embedding;

  await lemmaClient.datastore.query(
    `UPDATE feedback_items SET embedding = $1::vector WHERE id = $2`,
    [JSON.stringify(embedding), input.feedback_item_id]
  );

  const similar = await lemmaClient.datastore.query(
    `SELECT id, raw_text, source, cluster_id,
     1 - (embedding <=> $1::vector) as similarity
     FROM feedback_items
     WHERE id != $2
     AND status != 'noise'
     AND 1 - (embedding <=> $1::vector) > 0.82
     ORDER BY similarity DESC
     LIMIT 5`,
    [JSON.stringify(embedding), input.feedback_item_id]
  );

  return {
    success: true,
    similar_items: similar.rows,
    similar_count: similar.rows.length,
  };
}
