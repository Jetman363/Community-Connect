export interface MockUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  verified: boolean;
  role: "RESIDENT" | "ADMIN" | "MODERATOR";
  location: string;
  joinedAt: string;
  followers: number;
  following: number;
  badges: string[];
}

export const currentUser: MockUser = {
  id: "demo-resident",
  displayName: "Alex Resident",
  username: "alex_r",
  avatar: "AR",
  bio: "Oak Hills neighbor · dog parent · community volunteer",
  verified: true,
  role: "RESIDENT",
  location: "Oak Hills, CA",
  joinedAt: "2024-03-15T00:00:00Z",
  followers: 128,
  following: 94,
  badges: ["Verified Neighbor", "Event Host", "Safety Advocate"],
};

export const mockUsers: MockUser[] = [
  currentUser,
  {
    id: "u2",
    displayName: "Sarah Martinez",
    username: "sarah_m",
    avatar: "SM",
    bio: "HOA board member · organizing neighborhood cleanups",
    verified: true,
    role: "RESIDENT",
    location: "Oak Hills, CA",
    joinedAt: "2023-08-01T00:00:00Z",
    followers: 342,
    following: 156,
    badges: ["Verified Neighbor", "Top Contributor"],
  },
  {
    id: "u3",
    displayName: "James Kim",
    username: "james_k",
    avatar: "JK",
    bio: "Local photographer · lost pet alerts",
    verified: false,
    role: "RESIDENT",
    location: "Cedar Park, CA",
    joinedAt: "2024-01-20T00:00:00Z",
    followers: 89,
    following: 210,
    badges: ["Photographer"],
  },
  {
    id: "demo-admin",
    displayName: "Demo Admin",
    username: "admin",
    avatar: "DA",
    bio: "Community Connect platform administrator",
    verified: true,
    role: "ADMIN",
    location: "Oak Hills, CA",
    joinedAt: "2023-01-01T00:00:00Z",
    followers: 56,
    following: 12,
    badges: ["Admin", "Moderator"],
  },
];
