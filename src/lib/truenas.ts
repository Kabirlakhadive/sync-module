import axios from "axios";

const API_URL = process.env.TRUENAS_API_URL;
const API_TOKEN = process.env.TRUENAS_API_TOKEN;

const client = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization:
      API_TOKEN?.startsWith("Basic ") || API_TOKEN?.startsWith("Bearer ")
        ? API_TOKEN
        : `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  // Ignore SSL errors for POC if using self-signed certs (common in local TrueNAS)
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

export interface CloudCredential {
  id: number;
  name: string;
}

export async function createCloudCredential(
  name: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<CloudCredential> {
  const res = await client.post("/cloudsync/credentials", {
    name: name,
    provider: "GOOGLE_DRIVE",
    attributes: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  });
  return res.data;
}

export async function createCloudSyncTask(
  description: string,
  direction: "PUSH" | "PULL",
  credentialId: number,
  path: string,
  folderId: string,
  schedule: {
    minute: string;
    hour: string;
    dom: string;
    month: string;
    dow: string;
  },
  enabled: boolean = true
) {
  const res = await client.post("/cloudsync", {
    description,
    direction,
    credentials: credentialId,
    path: path, // Local path
    attributes: {
      folder_id: folderId,
    },
    schedule,
    enabled,
    // Trigger immediately if needed? creating task doesn't trigger it unless we perform sync.
  });
  return res.data;
}

export async function triggerCloudSyncTask(id: number) {
  const res = await client.post(`/cloudsync/id/${id}/sync`);
  return res.data;
}

export async function createSnapshotTask(dataset: string) {
  // Create periodic snapshot task
  // Dataset: e.g. "pool/dataset/project" (no /mnt/ prefix usually for ZFS dataset name, but API might take path or name. Usually name.)
  // If user provides "/mnt/pool/dataset", we might need to strip /mnt/.
  // TrueNAS API usually expects dataset name for snapshot tasks.

  // Simple heuristic: strip /mnt/ if present.
  const datasetName = dataset.startsWith("/mnt/")
    ? dataset.substring(5)
    : dataset;

  const res = await client.post("/pool/snapshottask", {
    dataset: datasetName,
    recursive: true,
    lifetime_value: 2,
    lifetime_unit: "WEEK",
    schedule: { minute: "0", hour: "0", dom: "*", month: "*", dow: "*" }, // Daily at midnight
    naming_schema: "auto-%Y-%m-%d_%H-%M",
  });
  return res.data;
}

export async function getCloudSyncTasks() {
  const res = await client.get("/cloudsync");
  return res.data;
}
