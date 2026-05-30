import { communityPhotos } from "@/lib/images/community-photos";
import type { ChallengeDto } from "@/types/engagement";

export const mockChallenges: ChallengeDto[] = [
  {
    id: "c1",
    title: "Neighborhood Cleanup Week",
    description: "Pick up litter, report hazards, and beautify our streets. Log each cleanup session.",
    endDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    participantCount: 89,
    milestone: 500,
    imageUrl: communityPhotos.feed.cleanup,
    joined: true,
    progress: 3,
  },
  {
    id: "c2",
    title: "10K Steps Daily",
    description: "Walk 10,000 steps every day for 30 days. Sync with your fitness app or log manually.",
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    participantCount: 234,
    milestone: 30,
    imageUrl: communityPhotos.events.youthSoccer,
    joined: false,
    progress: 0,
  },
  {
    id: "c3",
    title: "Support Local Business",
    description: "Visit 5 local businesses and leave a review. Earn bonus points for verified purchases.",
    endDate: new Date(Date.now() + 86400000 * 21).toISOString(),
    participantCount: 156,
    milestone: 5,
    imageUrl: communityPhotos.businesses.cornerStore,
    joined: true,
    progress: 2,
  },
  {
    id: "c4",
    title: "Kindness Chain",
    description: "Perform one act of kindness per day and share your story with the community.",
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    participantCount: 412,
    milestone: 7,
    imageUrl: communityPhotos.people.neighbors,
    joined: false,
    progress: 0,
  },
];

export function getChallengeById(id: string) {
  return mockChallenges.find((c) => c.id === id);
}
