"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) void reg.unregister();
        });
      }
      return;
    }
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-36 left-4 z-40 hidden md:flex"
      onClick={() => void deferred.prompt()}
    >
      <Download className="mr-2 h-4 w-4" />
      Install app
    </Button>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
