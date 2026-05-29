import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const community = await prisma.community.upsert({
    where: { slug: "demo-community" },
    update: {},
    create: {
      name: "Demo Community",
      slug: "demo-community",
      description: "Default seed community for local development",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "demo@communityconnect.app" },
    update: {},
    create: {
      email: "demo@communityconnect.app",
      passwordHash,
      role: "ADMIN",
      verified: true,
      profile: { create: { displayName: "Demo Admin", badges: ["verified", "admin"] } },
    },
  });

  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: admin.id } },
    update: {},
    create: { communityId: community.id, userId: admin.id, role: "ADMIN" },
  });

  const resident = await prisma.user.upsert({
    where: { email: "resident@communityconnect.app" },
    update: {},
    create: {
      email: "resident@communityconnect.app",
      passwordHash,
      role: "RESIDENT",
      verified: true,
      profile: { create: { displayName: "Alex Resident", neighborhood: "Oak Hills" } },
    },
  });

  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: resident.id } },
    update: {},
    create: { communityId: community.id, userId: resident.id, role: "RESIDENT" },
  });

  console.log("Seed complete.");
  console.log("Community:", community.slug);
  console.log("Demo login: demo@communityconnect.app / Demo1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
