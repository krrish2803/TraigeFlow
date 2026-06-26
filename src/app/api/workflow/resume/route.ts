import { NextRequest, NextResponse } from "next/server";
import { approveDraft, rejectDraft } from "@/lib/api-data";

export async function POST(req: NextRequest) {
  const { draft_id, approved, rejection_reason } = await req.json();

  if (!draft_id) {
    return NextResponse.json({ error: "draft_id required" }, { status: 400 });
  }

  if (approved) {
    const result = await approveDraft(draft_id);
    return NextResponse.json(result);
  } else {
    const result = await rejectDraft(draft_id, rejection_reason || "Rejected via workflow resume");
    return NextResponse.json(result);
  }
}
