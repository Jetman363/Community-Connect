import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

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

  await prisma.user.upsert({
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

  await prisma.safetyAlert.createMany({
    data: [
      {
        title: "Road Closure — Main St",
        description: "Water main repair until 6 PM.",
        severity: "ADVISORY",
        lat: 37.7749,
        lng: -122.4194,
      },
      {
        title: "Severe Weather Watch",
        description: "High winds expected this evening.",
        severity: "WARNING",
        lat: 37.78,
        lng: -122.41,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.business.createMany({
    data: [
      { name: "Oak Street Bakery", category: "Food", rating: 4.8, verified: true },
      { name: "Green Thumb Landscaping", category: "Services", rating: 4.5, verified: true },
      { name: "Community Auto Care", category: "Automotive", rating: 4.2 },
    ],
    skipDuplicates: true,
  });

  const event = await prisma.event.create({
    data: {
      title: "Farmers Market",
      location: "Town Square",
      startsAt: new Date(Date.now() + 86400000 * 2),
    },
  });

  await prisma.post.create({
    data: {
      authorId: admin.id,
      content: "Welcome to Community Connect! Share updates with your neighbors.",
      category: "GENERAL",
    },
  });

  await prisma.hOAAnnouncement.create({
    data: {
      title: "Pool maintenance scheduled",
      content: "Community pool closed Monday–Wednesday for annual maintenance.",
      priority: "normal",
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      sellerId: admin.id,
      title: "Garage sale — Saturday",
      description: "Furniture, toys, and more",
      type: "FOR_SALE",
    },
  });

  await prisma.document.createMany({
    data: [
      { title: "Community Bylaws 2024", url: "/docs/bylaws.pdf", category: "governance" },
      { title: "Architectural Guidelines", url: "/docs/architectural.pdf", category: "hoa" },
    ],
    skipDuplicates: true,
  });

  await prisma.vote.create({
    data: {
      title: "New playground equipment",
      description: "Approve budget for updated playground",
      options: ["Yes", "No", "Abstain"],
      status: "OPEN",
      endsAt: new Date(Date.now() + 86400000 * 14),
    },
  });

  console.log("Seed complete. Demo login: demo@communityconnect.app / Demo1234!");
  console.log("Sample event:", event.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
