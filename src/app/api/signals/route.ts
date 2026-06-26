import { NextRequest, NextResponse } from "next/server";
import { getSignalsPaginated, ingestSignal } from "@/lib/api-data";
import { getLemmaClient } from "@/lib/lemma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  const result = await getSignalsPaginated(page, limit);
  return NextResponse.json({ signals: result.items, total: result.total, page: result.page, totalPages: result.totalPages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, body: textBody, author, channel, title, sourceMessageId, externalUrl, rawType, productArea, metadata, rawPayload, timestamp } = body;

  if (!source || !textBody || !author) {
    return NextResponse.json({ error: "source, body, and author required" }, { status: 400 });
  }

  const signal = await ingestSignal({
    source: source as "slack" | "gmail" | "github" | "jira",
    sourceMessageId,
    body: textBody,
    author,
    channel,
    title: title || textBody.slice(0, 80),
    externalUrl,
    rawType,
    productArea,
    metadata,
    rawPayload,
    timestamp,
  });

  getLemmaClient().runFullPipeline(signal.id);

  return NextResponse.json({ ok: true, signalId: signal.id });
}
