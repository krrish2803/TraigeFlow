import { NextRequest, NextResponse } from "next/server";
import { getActivityPaginated } from "@/lib/api-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  const result = await getActivityPaginated(page, limit);
  return NextResponse.json({ activity: result.items, total: result.total, page: result.page, totalPages: result.totalPages });
}
