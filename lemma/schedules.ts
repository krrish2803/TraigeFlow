export const scheduleConfigs = [
  {
    name: "github-ingestion",
    workflow_name: "classify-and-embed",
    schedule_type: "cron" as const,
    cron: "*/30 * * * *",
    input: {
      repo: process.env.GITHUB_REPO || "owner/repo",
    },
  },
  {
    name: "daily-digest",
    workflow_name: "release-digest",
    schedule_type: "cron" as const,
    cron: "0 3 * * *",
    input: {
      post_to_slack: true,
      channel: process.env.SLACK_DIGEST_CHANNEL || "#eng-digest",
    },
  },
  {
    name: "slack-webhook",
    workflow_name: "classify-and-embed",
    schedule_type: "webhook" as const,
    input: {},
  },
];

export async function registerSchedules() {
  const lemmaClient = (await import("../lib/lemma")).default;
  for (const schedule of scheduleConfigs) {
    await lemmaClient.schedules.create(schedule);
  }
}
