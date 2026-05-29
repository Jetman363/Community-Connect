import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(64),
  role: z
    .enum([
      "RESIDENT",
      "BUSINESS_OWNER",
      "MODERATOR",
      "ADMIN",
      "PUBLIC_SAFETY",
      "HOA_MANAGER",
    ])
    .optional()
    .default("RESIDENT"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const postSchema = z.object({
  content: z.string().min(1).max(5000),
  title: z.string().max(200).optional(),
  category: z
    .enum(["GENERAL", "NEIGHBORHOOD", "SAFETY", "EVENTS", "MARKETPLACE", "HOA"])
    .optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const reportSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  lat: z.number().optional(),
  lng: z.number().optional(),
  mediaUrls: z.array(z.string()).optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

export const marketplaceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative().optional(),
  type: z.enum(["FOR_SALE", "WANTED", "JOB", "SERVICE"]).optional(),
});

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().max(8000),
    })
  ),
});
