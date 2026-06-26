export interface SlackMessageInput {
  channel: string;
  text: string;
  blocks?: unknown[];
}

export interface SlackMessageResult {
  ok: boolean;
  messageTs?: string;
  mock: boolean;
}

export async function postSlackMessage(input: SlackMessageInput): Promise<SlackMessageResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(`[Slack Mock] Would post to ${input.channel}: ${input.text.slice(0, 100)}`);
    return { ok: true, mock: true };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: input.channel,
      text: input.text,
      blocks: input.blocks,
    }),
  });

  if (!res.ok) {
    throw new Error(`Slack API error: ${res.status}`);
  }

  return { ok: true, mock: false };
}

export async function postActivityUpdate(description: string): Promise<SlackMessageResult> {
  return postSlackMessage({
    channel: process.env.SLACK_ACTIVITY_CHANNEL || "#eng-activity",
    text: description,
  });
}
