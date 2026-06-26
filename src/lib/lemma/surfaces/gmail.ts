// Placeholder for Gmail surface integration.
// In production, this would use the Gmail API (googleapis) to watch inbox,
// parse email threads, and extract signal data.
//
// For the demo, this returns mock results to keep the pipeline
// testable without real Gmail credentials.

export interface GmailSignalInput {
  subject: string;
  body: string;
  from: string;
  messageId: string;
}

export interface GmailSignalResult {
  ok: boolean;
  normalizedBody: string;
  author: string;
  channel: string;
}

export async function ingestGmailSignal(input: GmailSignalInput): Promise<GmailSignalResult> {
  const body = input.body.replace(/^Subject:.+(\n|$)/, "").trim();
  const cleaned = body
    .replace(/^>.*$/gm, "")
    .replace(/On.+wrote:/, "")
    .trim();

  return {
    ok: true,
    normalizedBody: cleaned || body,
    author: input.from,
    channel: "support",
  };
}
