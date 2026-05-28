"use client";

import { ProgramLoginForm } from "@/components/auth/ProgramLoginForm";
import { Eye } from "lucide-react";

export default function SupervisorLoginPage() {
  return (
    <ProgramLoginForm
      config={{
        role: "supervisor",
        title: "Supervisor Command Sign-In",
        subtitle: "Supervisor authorization required",
        redirectPath: "/supervisor",
        icon: Eye,
        submitLabel: "Access Supervisor Command",
        demoHint: "Demo: Sgt. Martinez / password martinez7200",
      }}
    />
  );
}
