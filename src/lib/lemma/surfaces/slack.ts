export interface SurfaceInput {
  channel: string;
  text: string;
  blocks?: unknown[];
}

export interface SurfaceResult {
  ok: boolean;
  messageTs?: string;
  mock: boolean;
}

export async function postSlackMessage(input: SurfaceInput): Promise<SurfaceResult> {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    console.log(`[Slack Surface Mock] Would post to ${input.channel}: ${input.text.slice(0, 100)}`);
    return { ok: true, mock: true };
  }

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: input.channel,
      text: input.text,
      blocks: input.blocks,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return { ok: true, messageTs: data.ts, mock: false };
}

export async function postActivityUpdate(description: string): Promise<SurfaceResult> {
  return postSlackMessage({
    channel: process.env.SLACK_ACTIVITY_CHANNEL || "#eng-activity",
    text: description,
  });
}
