"use client";

import { ProgramLoginForm } from "@/components/auth/ProgramLoginForm";
import { Monitor } from "lucide-react";

export default function DispatchLoginPage() {
  return (
    <ProgramLoginForm
      config={{
        role: "dispatcher",
        title: "CAD Dispatch Sign-In",
        subtitle: "Authorized dispatcher session required",
        redirectPath: "/dispatch",
        icon: Monitor,
        submitLabel: "Access Dispatch Console",
        demoHint: "Demo: Dispatcher Jones / password jones7100",
      }}
    />
  );
}
