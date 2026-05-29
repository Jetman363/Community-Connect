export type PostCategory =
  | "general"
  | "neighborhood"
  | "safety"
  | "events"
  | "marketplace"
  | "lost-found";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface MockPost {
  id: string;
  authorId: string;
  content: string;
  category: PostCategory;
  imageUrl?: string;
  videoUrl?: string;
  poll?: { question: string; options: PollOption[]; totalVotes: number };
  likes: number;
  comments: number;
  shares: number;
  saved: boolean;
  liked: boolean;
  following: boolean;
  createdAt: string;
}

export const mockPosts: MockPost[] = [
  {
    id: "p1",
    authorId: "u2",
    content:
      "Neighborhood cleanup this Saturday at 9 AM! We'll meet at Cedar Park entrance. Gloves and bags provided. Bring the whole family — coffee and donuts after. 🌿",
    category: "neighborhood",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b782?w=800&q=80",
    likes: 47,
    comments: 12,
    shares: 8,
    saved: false,
    liked: true,
    following: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "p2",
    authorId: "u3",
    content:
      "Has anyone seen a golden retriever near Cedar Park? Answers to 'Buddy', wearing a blue collar. Last seen 2 hours ago near the playground.",
    category: "lost-found",
    imageUrl: "https://images.unsplash.com/photo-1558787533-047468462f99?w=800&q=80",
    likes: 89,
    comments: 34,
    shares: 56,
    saved: true,
    liked: false,
    following: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "p3",
    authorId: "demo-resident",
    content: "Which day works best for the block party?",
    category: "events",
    poll: {
      question: "Block party date",
      options: [
        { id: "o1", label: "June 14 (Saturday)", votes: 42 },
        { id: "o2", label: "June 21 (Saturday)", votes: 28 },
        { id: "o3", label: "July 5 (Saturday)", votes: 15 },
      ],
      totalVotes: 85,
    },
    likes: 23,
    comments: 19,
    shares: 3,
    saved: false,
    liked: false,
    following: false,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "p4",
    authorId: "u2",
    content:
      "Reminder: street sweeping tomorrow on Oak Hills Drive. Move vehicles by 7 AM to avoid tickets.",
    category: "general",
    likes: 15,
    comments: 4,
    shares: 2,
    saved: false,
    liked: false,
    following: true,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "p5",
    authorId: "u3",
    content:
      "Suspicious vehicle reported on Elm St last night — dark SUV, no plates. If you have doorbell footage, please share with the neighborhood watch.",
    category: "safety",
    likes: 67,
    comments: 22,
    shares: 41,
    saved: false,
    liked: true,
    following: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "p6",
    authorId: "demo-resident",
    content: "Selling a barely-used patio set — $200 OBO. DM if interested!",
    category: "marketplace",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    likes: 8,
    comments: 6,
    shares: 1,
    saved: false,
    liked: false,
    following: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const postCategories: { id: PostCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "general", label: "General" },
  { id: "neighborhood", label: "Neighborhood" },
  { id: "safety", label: "Safety" },
  { id: "events", label: "Events" },
  { id: "marketplace", label: "Marketplace" },
  { id: "lost-found", label: "Lost & Found" },
];
