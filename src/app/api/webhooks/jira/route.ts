import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { routeIngestion, routeSync } from "@/lib/ingestion/router";

function verifyJiraSignature(req: NextRequest, bodyText: string): boolean {
  const secret = process.env.JIRA_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers.get("x-hub-signature");
  if (!signature) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(bodyText, "utf8").digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyJiraSignature(req, bodyText)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const event = body.event || "unknown";
  const issue = body.issue as { changelog?: { items?: Array<{ field: string; toString?: string }> } } | undefined;

  if (event === "jira:issue_created") {
    const result = routeIngestion("jira", body);
    return NextResponse.json({ ok: result.action !== "error", signalId: result.signalId, action: result.action });
  }

  if (event === "jira:issue_updated") {
    const hasStatusDone = issue?.changelog?.items?.some(
      (item: { field: string; toString?: string }) => item.field === "status" && item.toString?.toLowerCase() === "done",
    );

    if (hasStatusDone) {
      const result = routeSync("jira", body);
      return NextResponse.json({ ok: result.action !== "error", ...result });
    }

    return NextResponse.json({ ok: true, action: "ignored", reason: "No relevant status change" });
  }

  return NextResponse.json({ ok: true, action: "ignored", reason: `Unsupported Jira event: ${event}` });
}
