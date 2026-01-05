"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DriveFolderPicker } from "./drive-picker";
import { Loader2 } from "lucide-react";
import axios from "axios";

export function DashboardForm() {
  const [projectName, setProjectName] = useState("");
  const [nasPath, setNasPath] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [driveFolderName, setDriveFolderName] = useState("");

  const [status, setStatus] = useState<
    "idle" | "provisioning" | "success" | "error"
  >("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleProvision = async () => {
    if (!projectName || !nasPath || !driveFolderId) {
      addLog("Error: Missing fields");
      return;
    }

    setStatus("provisioning");
    setLogs([]);
    addLog("Starting provisioning...");

    try {
      const res = await axios.post("/api/provision", {
        projectName,
        nasPath,
        driveFolderId,
        driveFolderName,
      });

      if (res.data.success) {
        setStatus("success");
        addLog("Provisioning completed successfully!");
        addLog(`Results: ${JSON.stringify(res.data.results, null, 2)}`);
      } else {
        setStatus("error");
        addLog("Provisioning failed.");
      }
    } catch (err: any) {
      setStatus("error");
      addLog(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="project" className="text-sm font-medium">
            Project Name
          </label>
          <Input
            id="project"
            placeholder="My Project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="nas" className="text-sm font-medium">
            NAS Dataset Path
          </label>
          <Input
            id="nas"
            placeholder="/mnt/pool/dataset/project"
            value={nasPath}
            onChange={(e) => setNasPath(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Google Drive Folder</label>
          <DriveFolderPicker
            onSelect={(id, name) => {
              setDriveFolderId(id);
              setDriveFolderName(name);
            }}
          />
          {driveFolderName && (
            <p className="text-xs text-muted-foreground">
              Selected: {driveFolderName} ({driveFolderId})
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={handleProvision}
        disabled={status === "provisioning"}
        className="w-full"
      >
        {status === "provisioning" && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Provision Sync & Snapshots
      </Button>

      {logs.length > 0 && (
        <div className="mt-4 p-4 bg-slate-950 text-slate-50 text-sm rounded-md font-mono h-48 overflow-y-auto whitespace-pre-wrap">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
