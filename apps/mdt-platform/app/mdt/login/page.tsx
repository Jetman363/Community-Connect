"use client";

import { ProgramLoginForm } from "@/components/auth/ProgramLoginForm";
import { Radio } from "lucide-react";

export default function OfficerLoginPage() {
  return (
    <ProgramLoginForm
      config={{
        role: "officer",
        title: "Officer MDT Sign-In",
        subtitle: "CJIS session — verify identity before terminal access",
        redirectPath: "/mdt",
        icon: Radio,
        submitLabel: "Access MDT",
        showUnitField: true,
        demoHint: "Demo: Officer Smith / unit 1A12 / password smith4521",
      }}
    />
  );
}
