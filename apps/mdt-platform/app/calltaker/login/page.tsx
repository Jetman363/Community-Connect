"use client";

import { ProgramLoginForm } from "@/components/auth/ProgramLoginForm";
import { Phone } from "lucide-react";

export default function CalltakerLoginPage() {
  return (
    <ProgramLoginForm
      config={{
        role: "calltaker",
        title: "911 Call Intake Sign-In",
        subtitle: "Authorized calltaker session required",
        redirectPath: "/calltaker",
        icon: Phone,
        submitLabel: "Access Call Intake",
        requireServiceArea: false,
        demoHint: "Demo: Calltaker Williams / password williams7050",
      }}
    />
  );
}
