import { NextResponse } from "next/server";
import { getReleases, generateReleaseDigest } from "@/lib/api-data";

export async function GET() {
  const data = await getReleases();
  return NextResponse.json(data);
}

export async function POST() {
  const result = await generateReleaseDigest();
  const data = await getReleases();
  return NextResponse.json({ ...result, ...data });
}
