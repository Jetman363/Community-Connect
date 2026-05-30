import type { VerificationStatus, VerificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { VerificationRequestDto } from "@/types/marketplace";

export function mapVerification(row: {
  id: string;
  businessId: string;
  type: VerificationType;
  status: VerificationStatus;
  adminNotes: string | null;
  createdAt: Date;
}): VerificationRequestDto {
  return {
    id: row.id,
    businessId: row.businessId,
    type: row.type,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createVerificationRequest(
  businessId: string,
  type: VerificationType,
  documents: string[] = []
) {
  const row = await prisma.verificationRequest.create({
    data: { businessId, type, documents },
  });
  return mapVerification(row);
}

export async function listPendingVerifications() {
  const rows = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    include: { business: { select: { id: true, name: true, communityId: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return rows.map((r) => ({
    ...mapVerification(r),
    businessName: r.business.name,
    communityId: r.business.communityId,
  }));
}

export async function reviewVerification(
  id: string,
  status: "APPROVED" | "REJECTED",
  adminNotes?: string
) {
  const row = await prisma.verificationRequest.update({
    where: { id },
    data: { status, adminNotes, reviewedAt: new Date() },
    include: { business: true },
  });
  if (status === "APPROVED") {
    const badge = row.type.toLowerCase();
    await prisma.business.update({
      where: { id: row.businessId },
      data: {
        verified: true,
        verificationBadges: {
          set: [...new Set([...(row.business.verificationBadges ?? []), badge])],
        },
      },
    });
  }
  return mapVerification(row);
}
