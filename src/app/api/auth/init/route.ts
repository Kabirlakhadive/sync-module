import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  let { clientId, clientSecret } = body;

  // Fallback to env vars if provided (Server-Managed Mode)
  if (!clientId || !clientSecret) {
    clientId = process.env.GOOGLE_CLIENT_ID;
    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  // Set cookies for the callback phase
  const cookieStore = await cookies();
  cookieStore.set("google_client_id", clientId, {
    httpOnly: true,
    secure: false, // POC runs on HTTP
    path: "/",
  });
  cookieStore.set("google_client_secret", clientSecret, {
    httpOnly: true,
    secure: false, // POC runs on HTTP
    path: "/",
  });

  const url = getAuthUrl(clientId, clientSecret);

  return NextResponse.json({ url });
}
