import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DashboardForm } from "@/components/dashboard-form";

async function getUserEmail(
  token: string,
  clientId: string,
  clientSecret: string
) {
  const oauth2Client = getOAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({ access_token: token });
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  try {
    const info = await oauth2.userinfo.get();
    return info.data.email;
  } catch (e) {
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("google_access_token")?.value;
  let clientId = cookieStore.get("google_client_id")?.value;
  let clientSecret = cookieStore.get("google_client_secret")?.value;

  // Fallback to env vars if cookies are missing
  if (!clientId || !clientSecret) {
    clientId = process.env.GOOGLE_CLIENT_ID;
    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  if (!token || !clientId || !clientSecret) {
    redirect("/");
  }

  const email = await getUserEmail(token, clientId, clientSecret);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Connected as:{" "}
            <span className="font-semibold text-foreground">
              {email || "Unknown User"}
            </span>
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <DashboardForm />
        </div>
      </Card>
    </main>
  );
}
