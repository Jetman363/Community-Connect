import { communityPhotos } from "@/lib/images/community-photos";
import type { FamilyActivityDto } from "@/types/engagement";

export const mockFamilyActivities: FamilyActivityDto[] = [
  {
    id: "fa1",
    title: "Oak Hills Elementary — Early Dismissal",
    category: "school",
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    location: "Oak Hills Elementary",
    ageRange: "K-5",
    imageUrl: communityPhotos.events.youthSoccer,
  },
  {
    id: "fa2",
    title: "U12 Soccer Tournament",
    category: "sports",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    location: "Cedar Park Fields",
    ageRange: "8-12",
    imageUrl: communityPhotos.events.youthSoccer,
  },
  {
    id: "fa3",
    title: "Summer Adventure Camp — Registration Open",
    category: "camp",
    date: new Date(Date.now() + 86400000 * 30).toISOString(),
    location: "Community Center",
    ageRange: "6-14",
    imageUrl: communityPhotos.events.blockParty,
  },
  {
    id: "fa4",
    title: "Story Time at Library",
    category: "family",
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    location: "Oak Hills Library",
    ageRange: "2-8",
    imageUrl: communityPhotos.places.communityCenter,
  },
  {
    id: "fa5",
    title: "PTA Meeting — Budget Vote",
    category: "school",
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    location: "School Auditorium",
    ageRange: "All parents",
    imageUrl: communityPhotos.hero.hoa,
  },
  {
    id: "fa6",
    title: "Kids Bike Safety Workshop",
    category: "family",
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: "Town Square",
    ageRange: "5-12",
    imageUrl: communityPhotos.marketplace.bike,
  },
];

export const familyFilters = [
  { id: "all", label: "All" },
  { id: "school", label: "School" },
  { id: "sports", label: "Sports" },
  { id: "camp", label: "Camps" },
  { id: "family", label: "Family Fun" },
] as const;
