import lemmaClient from "../../lib/lemma";

export interface ReleaseDigestWorkflowInput {
  post_to_slack?: boolean;
  channel?: string;
}

export const releaseDigestWorkflow = {
  name: "release-digest",
  description: "Generates a full release readiness report",
  steps: [
    {
      name: "fetch_open_clusters",
      type: "function",
      config: {
        function_name: "fetch-open-issues",
      },
    },
    {
      name: "fetch_pending_drafts",
      type: "function",
      config: {
        function_name: "fetch-pending-drafts",
      },
    },
    {
      name: "categorize_by_risk",
      type: "function",
      config: {
        function_name: "categorize-risk",
      },
    },
    {
      name: "generate_digest_text",
      type: "function",
      config: {
        function_name: "generate-digest",
      },
    },
    {
      name: "create_digest_record",
      type: "update",
      config: {
        table: "release_digests",
      },
    },
    {
      name: "post_to_slack",
      type: "function",
      config: {
        function_name: "post-slack-summary",
        condition: "post_to_slack",
      },
    },
  ],
};

export async function executeReleaseDigest(input: ReleaseDigestWorkflowInput) {
  const clusters = await lemmaClient.records.list("feedback_clusters", {
    status: "open",
  } as Record<string, unknown>);

  const drafts = await lemmaClient.records.list("issue_drafts", {
    approval_status: "pending",
  } as Record<string, unknown>);

  const blockIssues = clusters.filter(
    (c: Record<string, unknown>) => c.release_risk === "block"
  );
  const cautionIssues = clusters.filter(
    (c: Record<string, unknown>) => c.release_risk === "caution"
  );
  const safeIssues = clusters.filter(
    (c: Record<string, unknown>) => c.release_risk === "safe" || !c.release_risk
  );

  const riskScore = blockIssues.length * 10 + cautionIssues.length * 5;
  const overallRisk = blockIssues.length > 0
    ? "block"
    : cautionIssues.length > 2
    ? "caution"
    : "safe";

  const history = await lemmaClient.datastore.query(
    `SELECT DATE(created_at) as date, overall_risk, risk_score, block_count
     FROM release_digests
     WHERE created_at > NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC`
  );

  const trendLine = history.rows
    .map((r: Record<string, unknown>) => `${r.date}: ${(r as Record<string, unknown>).overall_risk}`)
    .join("\n");

  const digestText = [
    `## Release Readiness Digest — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
    ``,
    `### Overall Risk: ${overallRisk.toUpperCase()}`,
    `Risk Score: ${riskScore}/100`,
    ``,
    `### Summary`,
    `- **${blockIssues.length}** blocker issues`,
    `- **${cautionIssues.length}** caution issues`,
    `- **${safeIssues.length}** safe issues`,
    `- **${drafts.length}** pending drafts awaiting review`,
    ``,
    ...(blockIssues.length > 0
      ? [
        `### 🔴 Release Blockers`,
        ...blockIssues.map(
          (c: Record<string, unknown>) =>
            `- **${(c as Record<string, unknown>).canonical_title || "Untitled"}** — severity ${(c as Record<string, unknown>).severity}`
        ),
        ``,
      ]
      : []),
    ...(cautionIssues.length > 0
      ? [
        `### 🟡 Caution Items`,
        ...cautionIssues.map(
          (c: Record<string, unknown>) =>
            `- **${(c as Record<string, unknown>).canonical_title || "Untitled"}** — severity ${(c as Record<string, unknown>).severity}`
        ),
        ``,
      ]
      : []),
    ...(history.rows.length > 0
      ? [
        `### 7-Day Trend`,
        `\`\`\``,
        trendLine,
        `\`\`\``,
        ``,
      ]
      : []),
    `### Recommendations`,
    overallRisk === "block"
      ? `**Do not ship.** Resolve all ${blockIssues.length} blocker(s) before proceeding.`
      : overallRisk === "caution"
      ? `**Proceed with caution.** Monitor the ${cautionIssues.length} caution item(s) closely during release.`
      : `**Ready to ship.** No blockers. Proceed with standard release process.`,
  ].join("\n");

  const digest = await lemmaClient.records.create("release_digests", {
    generated_at: new Date().toISOString(),
    overall_risk: overallRisk,
    risk_score: riskScore,
    block_count: blockIssues.length,
    caution_count: cautionIssues.length,
    safe_count: safeIssues.length,
    digest_text: digestText,
    slack_posted: false,
  });

  if (input.post_to_slack && input.channel) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        channel: input.channel,
        text: `Release Digest — ${overallRisk.toUpperCase()}`,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "📊 Release Readiness Digest" },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: digestText },
          },
        ],
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await lemmaClient.records.update("release_digests", digest.id as string, {
        slack_posted: true,
        slack_message_ts: new Date().toISOString(),
      });
    }
  }

  return {
    success: true,
    digest_id: digest.id,
    overall_risk: overallRisk,
    risk_score: riskScore,
    block_count: blockIssues.length,
    caution_count: cautionIssues.length,
    safe_count: safeIssues.length,
    digest_text: digestText,
    trend: history.rows,
  };
}
