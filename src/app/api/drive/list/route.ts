import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("google_access_token")?.value;
  let clientId = cookieStore.get("google_client_id")?.value;
  let clientSecret = cookieStore.get("google_client_secret")?.value;

  // Fallback to env vars if cookies are missing
  if (!clientId || !clientSecret) {
    clientId = process.env.GOOGLE_CLIENT_ID;
    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  if (!accessToken || !clientId || !clientSecret) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const oauth2Client = getOAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const response = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name)",
      pageSize: 100,
    });

    return NextResponse.json({ folders: response.data.files });
  } catch (error) {
    console.error("Drive API error", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
