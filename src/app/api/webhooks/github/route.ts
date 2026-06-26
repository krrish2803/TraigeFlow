import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { routeIngestion, routeSync } from "@/lib/ingestion/router";

function verifyGitHubSignature(req: NextRequest, bodyText: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(bodyText).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const event = req.headers.get("x-github-event") || "unknown";

  if (event === "ping") {
    return NextResponse.json({ ok: true, msg: "pong" });
  }

  if (!verifyGitHubSignature(req, bodyText)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const enrichedBody = { ...body, event };

  if (event === "issues" && (body.action === "opened" || body.action === "reopened")) {
    const result = routeIngestion("github", enrichedBody);
    return NextResponse.json({ ok: result.action !== "error", signalId: result.signalId });
  }

  if (event === "issues" && body.action === "closed") {
    const result = routeSync("github", enrichedBody);
    return NextResponse.json({ ok: result.action !== "error", ...result });
  }

  return NextResponse.json({ ok: true, action: "ignored" });
}
