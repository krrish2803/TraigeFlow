import { NextRequest, NextResponse } from "next/server";
import { getDraftsPaginated, approveDraft, rejectDraft } from "@/lib/api-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const result = await getDraftsPaginated(page, limit);
  return NextResponse.json({ drafts: result.items, total: result.total, page: result.page, totalPages: result.totalPages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, draftId, reason } = body;

  if (!draftId) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }

  if (action === "approve") {
    const result = await approveDraft(draftId);
    return NextResponse.json(result);
  }

  if (action === "reject") {
    const result = await rejectDraft(draftId, reason);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
