import { communityPhotos } from "@/lib/images/community-photos";
import type { DealDto } from "@/types/engagement";

export const mockDeals: DealDto[] = [
  {
    id: "d1",
    title: "20% Off Pastries",
    description: "Valid on all baked goods before 10 AM weekdays.",
    discount: "20% off",
    dealType: "PERCENTAGE",
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    redeemedCount: 47,
    imageUrl: communityPhotos.businesses.bakery,
    businessId: "b1",
    businessName: "Oak Hills Bakery",
    saved: true,
  },
  {
    id: "d2",
    title: "Free Lawn Consultation",
    description: "First-time customers get a free 30-min yard assessment.",
    discount: "Free",
    dealType: "FREEBIE",
    expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
    redeemedCount: 12,
    imageUrl: communityPhotos.businesses.landscaping,
    businessId: "b2",
    businessName: "GreenEdge Landscaping",
  },
  {
    id: "d3",
    title: "BOGO Oil Change",
    description: "Buy one standard oil change, get second at 50% off.",
    discount: "BOGO 50%",
    dealType: "BOGO",
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    redeemedCount: 28,
    imageUrl: communityPhotos.businesses.autoShop,
    businessId: "b3",
    businessName: "Main Street Auto",
  },
  {
    id: "d4",
    title: "$15 Off First Visit",
    description: "New patients welcome — includes basic wellness check.",
    discount: "$15 off",
    dealType: "FIXED",
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    redeemedCount: 8,
    imageUrl: communityPhotos.businesses.clinic,
    businessId: "b4",
    businessName: "Oak Hills Family Clinic",
    saved: false,
  },
  {
    id: "d5",
    title: "Happy Hour 2-for-1",
    description: "Tuesdays 4–6 PM on select appetizers and drinks.",
    discount: "2-for-1",
    dealType: "BOGO",
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    redeemedCount: 156,
    imageUrl: communityPhotos.businesses.cornerStore,
    businessId: "b5",
    businessName: "Corner Table Bistro",
  },
];

export function getDealById(id: string) {
  return mockDeals.find((d) => d.id === id);
}

export function getExpiringDeals(withinDays = 7) {
  const cutoff = Date.now() + withinDays * 86400000;
  return mockDeals.filter((d) => new Date(d.expiresAt).getTime() <= cutoff);
}
