import { NextResponse } from "next/server";
import { getSignal } from "@/lib/api-data";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const signal = await getSignal(params.id);
  if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Serialize with evidence included
  return NextResponse.json({
    signal: {
      ...signal,
      evidence: signal.evidence || [],
    },
  });
}
