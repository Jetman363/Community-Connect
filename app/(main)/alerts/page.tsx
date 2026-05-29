"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/use-socket";
import { formatRelative } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  active: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.items ?? d.alerts ?? []));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("alert:subscribe");
    socket.on("alert:new", (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });
    return () => {
      socket.off("alert:new");
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Safety Alerts</h1>
        <Badge variant={connected ? "success" : "default"}>
          {connected ? "Live" : "Polling"}
        </Badge>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          Crime map placeholder — integrate Google Maps when API key is configured.
        </CardContent>
      </Card>

      <div className="space-y-3">
        {alerts.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={a.severity === "EMERGENCY" ? "border-[var(--emergency)]" : ""}>
              <CardHeader className="flex-row items-start justify-between pb-0">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <Badge variant={a.severity === "EMERGENCY" || a.severity === "WARNING" ? "emergency" : "accent"}>
                  {a.severity}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{a.description}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{formatRelative(a.createdAt)}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
