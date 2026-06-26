import { NextRequest, NextResponse } from "next/server";
import { routeGmailMessage } from "@/lib/ingestion/router";
import { mockGmailMessage } from "@/lib/ingestion/gmail";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { emailAddress, historyId } = body;
  if (emailAddress && historyId) {
    return NextResponse.json({ ok: true, action: "notification_received", emailAddress, historyId });
  }

  if (body.message?.data) {
    return NextResponse.json({ ok: true, action: "push_received" });
  }

  if (body.id && body.threadId) {
    const result = routeGmailMessage(body);
    if (result.action === "error") {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, signalId: result.signalId, action: result.action });
  }

  return NextResponse.json({ ok: false, error: "Invalid Gmail payload" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "demo";

  if (mode === "demo") {
    const mockMessage = mockGmailMessage({
      snippet: "I keep getting an error when trying to checkout. The payment page times out every time.",
      payload: {
        headers: [
          { name: "Subject", value: "Checkout payment keeps failing" },
          { name: "From", value: "Angry Customer <angry@customer.com>" },
          { name: "To", value: "support@triageflow.io" },
          { name: "Date", value: new Date().toUTCString() },
        ],
      },
    });

    const result = routeGmailMessage(mockMessage);
    return NextResponse.json({
      ok: result.action !== "error",
      signalId: result.signalId,
      action: result.action,
      note: "Demo mode: injected mock Gmail message",
    });
  }

  return NextResponse.json({ ok: true, message: "Gmail webhook endpoint ready. POST a Gmail push notification or message payload." });
}
