import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createCloudCredential,
  createCloudSyncTask,
  createSnapshotTask,
  triggerCloudSyncTask,
} from "@/lib/truenas";

export async function POST(req: Request) {
  const body = await req.json();
  const { projectName, nasPath, driveFolderId, driveFolderName } = body;

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;
  const clientId = cookieStore.get("google_client_id")?.value;
  const clientSecret = cookieStore.get("google_client_secret")?.value;

  if (!refreshToken || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing auth or client credentials. Please re-login." },
      { status: 401 }
    );
  }

  const results: Record<string, any> = {
    credential: null,
    pullTask: null,
    pushTask: null,
    snapshotTask: null,
    pullTrigger: null,
  };

  try {
    // 1. Create Cloud Credential
    const credName = `${projectName}-gdrive-creds-${Date.now()}`;
    console.log(`Creating credential: ${credName}`);
    const credential = await createCloudCredential(
      credName,
      clientId,
      clientSecret,
      refreshToken
    );
    results.credential = credential.id;

    // 2. Create PULL Task (Drive -> NAS)
    console.log("Creating PULL task");
    const pullTask = await createCloudSyncTask(
      `${projectName} - Initial PULL`,
      "PULL",
      credential.id,
      nasPath,
      driveFolderId,
      { minute: "0", hour: "0", dom: "1", month: "1", dow: "*" },
      false
    );
    results.pullTask = pullTask.id;

    // 3. Trigger PULL
    console.log("Triggering PULL task");
    const trigger = await triggerCloudSyncTask(pullTask.id);
    results.pullTrigger = trigger;

    // 4. Create Ongoing PUSH Task (NAS -> Drive)
    console.log("Creating PUSH task");
    const pushTask = await createCloudSyncTask(
      `${projectName} - Ongoing PUSH`,
      "PUSH",
      credential.id,
      nasPath,
      driveFolderId,
      { minute: "*/15", hour: "*", dom: "*", month: "*", dow: "*" },
      true
    );
    results.pushTask = pushTask.id;

    // 5. Create Snapshot Task
    console.log("Creating Snapshot task");
    try {
      const snapTask = await createSnapshotTask(nasPath);
      results.snapshotTask = snapTask.id;
    } catch (e: any) {
      console.error("Snapshot task failed (might already exist):", e.message);
      results.snapshotTask = "Failed/Skipped: " + e.message;
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Provisioning error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || error.message, results },
      { status: 500 }
    );
  }
}
