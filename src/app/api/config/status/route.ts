import { NextResponse } from "next/server";

export async function GET() {
  const hasEnvCreds =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  return NextResponse.json({ hasEnvCreds });
}
