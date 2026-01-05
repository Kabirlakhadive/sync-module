import { getOAuth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  let clientId = cookieStore.get("google_client_id")?.value;
  let clientSecret = cookieStore.get("google_client_secret")?.value;

  // Fallback to env vars if cookies are missing (Server-Managed Mode)
  if (!clientId || !clientSecret) {
    clientId = process.env.GOOGLE_CLIENT_ID;
    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing client credentials in session" },
      { status: 400 }
    );
  }

  try {
    const oauth2Client = getOAuth2Client(clientId, clientSecret);
    const { tokens } = await oauth2Client.getToken(code);

    // Redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // Store tokens in cookies
    if (tokens.access_token) {
      response.cookies.set("google_access_token", tokens.access_token, {
        httpOnly: true,
        secure: false, // POC runs on HTTP
        path: "/",
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: false, // POC runs on HTTP
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Auth error", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
