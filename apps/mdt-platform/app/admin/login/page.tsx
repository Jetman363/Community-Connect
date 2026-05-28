"use client";

import { ProgramLoginForm } from "@/components/auth/ProgramLoginForm";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <ProgramLoginForm
      config={{
        role: "admin",
        title: "Admin / Demo Control Sign-In",
        subtitle: "Administrator authorization required",
        redirectPath: "/supervisor",
        icon: Shield,
        submitLabel: "Access Admin Console",
        demoHint: "Demo: Admin User / password admin7300",
      }}
    />
  );
}
