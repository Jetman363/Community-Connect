"use client";

import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { EnterpriseConsole } from "@/components/admin/enterprise-console";

export default function AdminPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Enterprise Admin"
        description="Platform overview, RBAC, moderation command center, analytics, and broadcasts"
      />
      <EnterpriseConsole />
    </PageTransition>
  );
}
