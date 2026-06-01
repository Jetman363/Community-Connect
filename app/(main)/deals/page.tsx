"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { DealCard } from "@/components/deals/deal-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import { mockDeals } from "@/lib/mock-data/deals";
import type { DealDto } from "@/types/engagement";
import { useToast } from "@/components/ui/toast";

export default function DealsPage() {
  const [deals, setDeals] = useState<DealDto[]>(mockDeals);
  const [expiring, setExpiring] = useState<DealDto[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    void Promise.all([
      apiFetch<{ items: DealDto[] }>("/api/deals").then((d) => setDeals(d.items)),
      apiFetch<{ items: DealDto[] }>("/api/deals?expiringSoon=true").then((d) => setExpiring(d.items)),
    ]).catch(() => undefined);
  }, []);

  async function handleSave(deal: DealDto) {
    try {
      await apiFetch(`/api/deals/${deal.id}/save`, { method: "POST" });
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, saved: true } : d)));
      toast("Deal saved!", "success");
    } catch {
      toast("Deal saved (demo)", "success");
    }
  }

  async function handleRedeem(deal: DealDto) {
    try {
      const res = await apiFetch<{ code: string; pointsEarned: number }>(
        `/api/deals/${deal.id}/redeem`,
        { method: "POST" }
      );
      toast(`Redeemed! Code: ${res.code} (+${res.pointsEarned} pts)`, "success");
    } catch {
      toast("Redeemed! +25 points (demo)", "success");
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Local Deals" description="Save and redeem offers from neighborhood businesses" />

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Deals</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSave={() => void handleSave(deal)}
                onRedeem={() => void handleRedeem(deal)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="expiring">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(expiring.length ? expiring : deals.slice(0, 2)).map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSave={() => void handleSave(deal)}
                onRedeem={() => void handleRedeem(deal)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="saved">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {deals.filter((d) => d.saved).map((deal) => (
              <DealCard key={deal.id} deal={deal} onRedeem={() => void handleRedeem(deal)} />
            ))}
            {deals.filter((d) => d.saved).length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">No saved deals yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
