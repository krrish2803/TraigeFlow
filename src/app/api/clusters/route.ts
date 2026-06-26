import { NextRequest, NextResponse } from "next/server";
import { getClustersPaginated, runTriage } from "@/lib/api-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const result = await getClustersPaginated(page, limit);
  return NextResponse.json({ clusters: result.items, total: result.total, page: result.page, totalPages: result.totalPages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, clusterId } = body;

  if (action === "triage" && clusterId) {
    const result = await runTriage(clusterId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
