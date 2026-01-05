"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface DriveFile {
  id: string;
  name: string;
}

interface DrivePickerProps {
  onSelect: (folderId: string, folderName: string) => void;
}

export function DriveFolderPicker({ onSelect }: DrivePickerProps) {
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await axios.get("/api/drive/list");
        if (res.data.folders) {
          setFolders(res.data.folders);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load folders");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Drive
        folders...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <Select
      onValueChange={(val) => {
        const folder = folders.find((f) => f.id === val);
        if (folder) onSelect(folder.id, folder.name);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Google Drive Folder" />
      </SelectTrigger>
      <SelectContent>
        {folders.map((f) => (
          <SelectItem key={f.id} value={f.id} className="cursor-pointer">
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
