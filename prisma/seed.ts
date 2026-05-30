import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const community = await prisma.community.upsert({
    where: { slug: "demo-community" },
    update: {},
    create: {
      name: "Oak Hills Community",
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

  const resident = await prisma.user.upsert({
    where: { email: "resident@communityconnect.app" },
    update: {},
    create: {
      email: "resident@communityconnect.app",
      passwordHash,
      role: "RESIDENT",
      verified: true,
      profile: {
        create: { displayName: "Alex Resident", neighborhood: "Oak Hills", badges: ["Verified Neighbor"] },
      },
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah@communityconnect.app" },
    update: {},
    create: {
      email: "sarah@communityconnect.app",
      passwordHash,
      role: "RESIDENT",
      verified: true,
      profile: { create: { displayName: "Sarah Martinez", neighborhood: "Oak Hills" } },
    },
  });

  const james = await prisma.user.upsert({
    where: { email: "james@communityconnect.app" },
    update: {},
    create: {
      email: "james@communityconnect.app",
      passwordHash,
      role: "RESIDENT",
      verified: false,
      profile: { create: { displayName: "James Kim", neighborhood: "Cedar Park" } },
    },
  });

  const publicSafety = await prisma.user.upsert({
    where: { email: "safety@communityconnect.app" },
    update: {},
    create: {
      email: "safety@communityconnect.app",
      passwordHash,
      role: "PUBLIC_SAFETY",
      verified: true,
      profile: { create: { displayName: "Oak Hills PD", badges: ["Public Safety"] } },
    },
  });

  for (const [user, role] of [
    [admin, "ADMIN"],
    [resident, "RESIDENT"],
    [sarah, "RESIDENT"],
    [james, "RESIDENT"],
    [publicSafety, "PUBLIC_SAFETY"],
  ] as const) {
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: user.id } },
      update: {},
      create: { communityId: community.id, userId: user.id, role },
    });
  }

  await prisma.post.deleteMany({ where: { communityId: community.id } });

  const post1 = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: resident.id,
      content:
        "Just finished organizing the neighborhood cleanup — thanks to everyone who showed up! We collected 12 bags of trash along the creek trail.",
      category: "GENERAL",
      type: "TEXT",
      hashtags: ["cleanup", "community"],
    },
  });

  const post2 = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: sarah.id,
      content:
        "Reminder: street parking on Oak Ave is restricted tomorrow for the farmers market. Please use the community lot.",
      category: "EVENTS",
      type: "TEXT",
    },
  });

  const post3 = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: james.id,
      content:
        "Lost cat — orange tabby named Mango, last seen near Cedar Park playground. Very friendly, wearing a blue collar.",
      category: "NEIGHBORHOOD",
      type: "IMAGE",
      mediaUrls: ["/placeholder-cat.jpg"],
      hashtags: ["lostfound", "pets"],
    },
  });

  await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: resident.id,
      content: "What time works best for the summer block party?",
      category: "EVENTS",
      type: "POLL",
      pollData: {
        question: "Preferred block party start time",
        options: [
          { id: "opt-0", label: "4 PM", votes: 42 },
          { id: "opt-1", label: "5 PM", votes: 67 },
          { id: "opt-2", label: "6 PM", votes: 31 },
        ],
        votes: {},
      },
    },
  });

  await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: sarah.id,
      content:
        "Highly recommend Green Thumb Landscaping — they did an amazing job on our front yard. Fair pricing and super professional.",
      category: "NEIGHBORHOOD",
      type: "TEXT",
      hashtags: ["recommendations"],
    },
  });

  await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: james.id,
      content:
        "Heads up — noticed a broken streetlight on the corner of 2nd and Maple. Reported to public works but wanted to flag it here too.",
      category: "SAFETY",
      type: "TEXT",
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: sarah.id,
      content: "Thanks for organizing! Already looking forward to the next one.",
    },
  });

  await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: resident.id,
      parentId: comment1.id,
      content: "Same here — maybe we can do a planting day next month?",
    },
  });

  await prisma.comment.create({
    data: {
      postId: post3.id,
      authorId: resident.id,
      content: "I'll keep an eye out during my evening walks!",
    },
  });

  await prisma.reaction.createMany({
    data: [
      { postId: post1.id, userId: sarah.id, type: "LIKE" },
      { postId: post1.id, userId: james.id, type: "LIKE" },
      { postId: post1.id, userId: admin.id, type: "HELPFUL" },
      { postId: post2.id, userId: resident.id, type: "LIKE" },
      { postId: post3.id, userId: sarah.id, type: "LIKE" },
      { postId: post3.id, userId: resident.id, type: "SUPPORT" },
    ],
  });

  await prisma.follow.createMany({
    data: [
      { followerId: resident.id, targetType: "USER", targetId: sarah.id },
      { followerId: james.id, targetType: "USER", targetId: resident.id },
      { followerId: resident.id, targetType: "TOPIC", targetId: "SAFETY" },
    ],
    skipDuplicates: true,
  });

  await prisma.savedPost.create({
    data: { userId: resident.id, postId: post2.id },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: resident.id,
        type: "COMMENT",
        title: "Sarah Martinez commented",
        body: "Thanks for organizing! Already looking forward to the next one.",
        link: "/feed",
      },
      {
        userId: resident.id,
        type: "LIKE",
        title: "New like on your post",
        body: "Someone liked your cleanup post",
        link: "/feed",
        read: true,
      },
      {
        userId: sarah.id,
        type: "FOLLOW",
        title: "New follower",
        body: "Alex Resident started following you",
        link: "/profile",
      },
    ],
  });

  await prisma.safetyAlert.deleteMany({ where: { communityId: community.id } });
  await prisma.report.deleteMany({ where: { communityId: community.id } });
  await prisma.geofenceZone.deleteMany({ where: { communityId: community.id } });

  const alerts = await Promise.all([
    prisma.safetyAlert.create({
      data: {
        communityId: community.id,
        createdById: publicSafety.id,
        title: "Armed Robbery — Avoid Main St",
        description: "Police responding near 4th & Main. Avoid area until cleared.",
        category: "CRIME",
        severity: "CRITICAL",
        lat: 37.7749,
        lng: -122.4194,
        radiusM: 800,
        locationLabel: "4th & Main St",
        source: "Oak Hills PD",
        active: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    }),
    prisma.safetyAlert.create({
      data: {
        communityId: community.id,
        createdById: publicSafety.id,
        title: "Severe Wind Advisory",
        description: "Gusts up to 45 mph expected 6–10 PM.",
        category: "WEATHER",
        severity: "MODERATE",
        lat: 37.78,
        lng: -122.41,
        radiusM: 5000,
        locationLabel: "Oak Hills County",
        source: "National Weather Service",
        active: true,
      },
    }),
    prisma.safetyAlert.create({
      data: {
        communityId: community.id,
        title: "Road Closure — Water Main Repair",
        description: "Oak Ave closed between Cedar & Pine until 6 PM.",
        category: "TRAFFIC",
        severity: "LOW",
        lat: 37.772,
        lng: -122.422,
        locationLabel: "Oak Ave",
        source: "Public Works",
        active: true,
      },
    }),
  ]);

  await prisma.report.create({
    data: {
      communityId: community.id,
      reporterId: resident.id,
      title: "Broken streetlight",
      description: "Light out at 2nd & Maple — hazard for evening walkers.",
      category: "MAINTENANCE",
      severity: "LOW",
      suggestedCategory: "MAINTENANCE",
      status: "SUBMITTED",
      lat: 37.772,
      lng: -122.422,
      locationLabel: "2nd & Maple",
    },
  });

  await prisma.report.create({
    data: {
      communityId: community.id,
      reporterId: james.id,
      title: "Suspicious vehicle",
      description: "Unmarked van parked on Cedar Park loop for 3+ hours.",
      category: "CRIME",
      severity: "MODERATE",
      suggestedCategory: "CRIME",
      status: "UNDER_REVIEW",
      anonymous: true,
      lat: 37.776,
      lng: -122.415,
      assignedToId: publicSafety.id,
    },
  });

  const hoaZone = await prisma.geofenceZone.create({
    data: {
      communityId: community.id,
      name: "Oak Hills HOA Boundary",
      type: "HOA",
      centerLat: 37.775,
      centerLng: -122.418,
      radiusM: 2000,
    },
  });

  await prisma.geofenceZone.create({
    data: {
      communityId: community.id,
      name: "Downtown Emergency Zone",
      type: "EMERGENCY",
      centerLat: 37.7749,
      centerLng: -122.4194,
      radiusM: 1200,
    },
  });

  await prisma.alertSubscription.create({
    data: {
      userId: resident.id,
      zoneId: hoaZone.id,
      notifyEmergency: true,
      notifyModerate: true,
    },
  });

  await prisma.watchArea.create({
    data: {
      userId: resident.id,
      name: "Home",
      type: "HOME",
      centerLat: 37.774,
      centerLng: -122.42,
      radiusM: 804,
    },
  });

  await prisma.alertAcknowledgment.create({
    data: { userId: resident.id, alertId: alerts[1].id },
  });

  console.log("Seed complete (Phase 4).");
  console.log("Community:", community.slug);
  console.log("Alerts:", alerts.length, "| Reports: 2 | Geofences: 2");
  console.log("Demo login: demo@communityconnect.app / Demo1234!");
  console.log("Resident:   resident@communityconnect.app / Demo1234!");
  console.log("Safety:     safety@communityconnect.app / Demo1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
