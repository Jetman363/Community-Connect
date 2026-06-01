"use client";

import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EnterpriseConsole } from "@/components/admin/enterprise-console";

export default function AdminPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Enterprise Admin"
        description="Platform overview, RBAC, moderation command center, analytics, and broadcasts"
        action={
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              Admin Settings
            </Button>
          </Link>
        }
      />
      <EnterpriseConsole />
    </PageTransition>
  );
}
