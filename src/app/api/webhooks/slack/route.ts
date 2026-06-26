import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { routeIngestion } from "@/lib/ingestion/router";
import { getLemmaClient } from "@/lib/lemma/client";

function verifySlackSignature(req: NextRequest, bodyText: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // no secret configured → skip verification

  const signature = req.headers.get("x-slack-signature");
  const timestamp = req.headers.get("x-slack-request-timestamp");

  if (!signature || !timestamp) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false; // replay attack

  const sigBase = `v0:${timestamp}:${bodyText}`;
  const expected = `v0=${crypto.createHmac("sha256", secret).update(sigBase).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function enrichSignal(signalId: string, event: Record<string, unknown>) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;

  const lemma = getLemmaClient();
  const slackEvent = event.event as Record<string, unknown> | undefined;
  if (!slackEvent) return;

  const userId = slackEvent.user as string | undefined;
  const channel = slackEvent.channel as string | undefined;
  const ts = slackEvent.ts as string | undefined;

  let displayName: string | undefined;
  let permalink: string | undefined;

  if (userId) {
    try {
      const userRes = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (userData.ok) {
        displayName = userData.user?.real_name || userData.user?.name || userId;
      }
    } catch {
      // fallback to user ID
    }
  }

  if (channel && ts) {
    try {
      const permalinkRes = await fetch(
        `https://slack.com/api/chat.getPermalink?channel=${channel}&message_ts=${ts}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const permalinkData = await permalinkRes.json();
      if (permalinkData.ok) {
        permalink = permalinkData.permalink;
      }
    } catch {
      // fallback to no permalink
    }
  }

  if (displayName || permalink) {
    lemma.store.updateSignal(signalId, {
      ...(displayName ? { author: displayName } : {}),
      ...(permalink ? { externalUrl: permalink } : {}),
    });
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

  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (!verifySlackSignature(req, bodyText)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const result = routeIngestion("slack", body);

  if (result.action === "error") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  if (result.signalId) {
    enrichSignal(result.signalId, body as Record<string, unknown>).catch(() => {});
  }

  return NextResponse.json({ ok: true, signalId: result.signalId, action: result.action });
}
