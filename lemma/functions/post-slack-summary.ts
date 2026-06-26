import lemmaClient from "../../lib/lemma";

const RISK_EMOJI: Record<string, string> = {
  block: "🔴",
  caution: "🟡",
  safe: "🟢",
};

export async function postSlackSummary(input: {
  channel: string;
  draft_id?: string;
  digest_id?: string;
  message_type: "issue_created" | "release_digest";
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("SLACK_WEBHOOK_URL not set");

  if (input.message_type === "issue_created" && input.draft_id) {
    const draft = await lemmaClient.records.get("issue_drafts", input.draft_id);
    if (!draft) throw new Error(`Draft ${input.draft_id} not found`);

    const cluster = await lemmaClient.records.get("feedback_clusters", draft.cluster_id as string);

    const riskEmoji = RISK_EMOJI[draft.release_risk as string] || "⚪";

    const payload = {
      channel: input.channel,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `${riskEmoji} New Issue Created: ${draft.identifier}` },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*${draft.title}*\n${draft.summary}` },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Severity:* ${(draft.severity as string)?.toUpperCase()}` },
            { type: "mrkdwn", text: `*Release Risk:* ${(draft.release_risk as string)?.toUpperCase()}` },
            { type: "mrkdwn", text: `*Signals:* ${cluster?.signal_count || 0} across ${cluster?.source_count || 0} sources` },
            { type: "mrkdwn", text: `*Area:* ${draft.severity || "Unknown"}` },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View GitHub Issue" },
              url: draft.github_issue_url as string,
              style: "primary",
            },
          ],
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await lemmaClient.records.update("issue_drafts", input.draft_id, {
      slack_message_ts: new Date().toISOString(),
      slack_channel: input.channel,
    });
  }

  if (input.message_type === "release_digest" && input.digest_id) {
    const digest = await lemmaClient.records.get("release_digests", input.digest_id);
    if (!digest) throw new Error(`Digest ${input.digest_id} not found`);

    const payload = {
      channel: input.channel,
      text: `Release Digest — ${(digest.overall_risk as string)?.toUpperCase()}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `📊 Release Readiness Digest` },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: digest.digest_text as string },
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await lemmaClient.records.update("release_digests", input.digest_id, {
      slack_posted: true,
      slack_message_ts: new Date().toISOString(),
    });
  }

  return { success: true };
}
