import type { InquiryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InquiryDto } from "@/types/marketplace";

export function mapInquiry(row: {
  id: string;
  message: string;
  quoteRequest: boolean;
  status: InquiryStatus;
  businessId: string | null;
  listingId: string | null;
  jobId: string | null;
  createdAt: Date;
}): InquiryDto {
  return {
    id: row.id,
    message: row.message,
    quoteRequest: row.quoteRequest,
    status: row.status,
    businessId: row.businessId,
    listingId: row.listingId,
    jobId: row.jobId,
    createdAt: row.createdAt.toISOString(),
  };
}

const SPAM_PATTERNS = [/https?:\/\//gi, /bitcoin/i, /crypto/i];

export function isInquirySpam(message: string): boolean {
  if (message.length < 5) return true;
  const links = (message.match(SPAM_PATTERNS[0]) ?? []).length;
  if (links > 3) return true;
  if (SPAM_PATTERNS.slice(1).some((p) => p.test(message))) return true;
  return false;
}

export async function createInquiry(data: Prisma.InquiryUncheckedCreateInput) {
  if (isInquirySpam(data.message)) {
    return { spam: true as const };
  }
  const row = await prisma.inquiry.create({ data });
  if (data.businessId) {
    await prisma.businessAnalytics.upsert({
      where: { businessId: data.businessId },
      create: { businessId: data.businessId, inquiryCount: 1 },
      update: { inquiryCount: { increment: 1 } },
    });
  }
  return { spam: false as const, inquiry: mapInquiry(row) };
}

export async function listInquiries(userId: string, role?: string) {
  const where =
    role === "BUSINESS_OWNER"
      ? { business: { ownerId: userId } }
      : { userId };
  const rows = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(mapInquiry);
}

export async function updateInquiryStatus(id: string, status: InquiryStatus, actorId: string) {
  const row = await prisma.inquiry.findUnique({
    where: { id },
    include: { business: true },
  });
  if (!row) return null;
  if (row.userId !== actorId && row.business?.ownerId !== actorId) return null;
  const updated = await prisma.inquiry.update({ where: { id }, data: { status } });
  return mapInquiry(updated);
}
