"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HardDrive, Loader2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [isServerConfigured, setIsServerConfigured] = useState(false);
  const router = useRouter();

  useEffect(() => {
    axios
      .get("/api/config/status")
      .then((res) => {
        if (res.data.hasEnvCreds) {
          setIsServerConfigured(true);
        }
      })
      .catch((e) => console.error("Failed to check config status", e));
  }, []);

  const handleLogin = async () => {
    // Validation only required if NOT server configured
    if (!isServerConfigured && (!clientId || !clientSecret)) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/init", {
        clientId,
        clientSecret,
      });
      if (res.data.url) {
        router.push(res.data.url);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <Card className="w-[450px] shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <HardDrive className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">TrueNAS Drive Sync</CardTitle>
          <CardDescription>
            {isServerConfigured
              ? "Credentials configured by Administrator"
              : "Enter Google Client Credentials"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {!isServerConfigured && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client ID</label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxx.apps.googleusercontent.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Secret</label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                />
              </div>
            </>
          )}

          {isServerConfigured && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm text-center border border-green-200">
              ✓ Server-Managed Mode Active
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={
              loading || (!isServerConfigured && (!clientId || !clientSecret))
            }
            size="lg"
            className="w-full font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in with Google
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            These credentials are used to authorize access and will be passed to
            TrueNAS.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
