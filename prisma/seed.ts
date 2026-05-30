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

  await prisma.userSocialLink.deleteMany({
    where: { userId: { in: [resident.id, sarah.id, admin.id] } },
  });

  await prisma.userSocialLink.createMany({
    data: [
      {
        userId: resident.id,
        platform: "INSTAGRAM",
        profileUrl: "https://instagram.com/alex_r",
        username: "alex_r",
        isPublic: true,
      },
      {
        userId: resident.id,
        platform: "FACEBOOK",
        profileUrl: "https://facebook.com/alex.resident",
        username: "alex.resident",
        isPublic: true,
      },
      {
        userId: resident.id,
        platform: "LINKEDIN",
        profileUrl: "https://linkedin.com/in/alex-resident",
        username: "alex-resident",
        isPublic: false,
      },
      {
        userId: sarah.id,
        platform: "INSTAGRAM",
        profileUrl: "https://instagram.com/sarah_m",
        username: "sarah_m",
        isPublic: true,
      },
      {
        userId: sarah.id,
        platform: "TWITTER",
        profileUrl: "https://x.com/sarah_m",
        username: "sarah_m",
        isPublic: true,
      },
    ],
  });

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

  // ─── Phase 5: Marketplace, businesses, jobs ───────────────────────────────

  const businessOwner = await prisma.user.upsert({
    where: { email: "business@communityconnect.app" },
    update: {},
    create: {
      email: "business@communityconnect.app",
      passwordHash,
      role: "BUSINESS_OWNER",
      verified: true,
      profile: {
        create: { displayName: "Maria Chen", neighborhood: "Oak Hills", badges: ["Business Owner"] },
      },
    },
  });

  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: businessOwner.id } },
    update: { role: "BUSINESS_OWNER" },
    create: { communityId: community.id, userId: businessOwner.id, role: "BUSINESS_OWNER" },
  });

  await prisma.marketplaceListing.deleteMany({ where: { communityId: community.id } });
  await prisma.business.deleteMany({ where: { communityId: community.id } });
  await prisma.jobListing.deleteMany({ where: { communityId: community.id } });

  const bakery = await prisma.business.create({
    data: {
      communityId: community.id,
      ownerId: businessOwner.id,
      name: "Oak Street Bakery",
      description: "Artisan breads, pastries, and locally roasted coffee.",
      category: "food",
      categories: ["Bakery", "Coffee", "Local"],
      address: "12 Oak St, Oak Hills",
      phone: "(555) 234-5678",
      lat: 37.774,
      lng: -122.42,
      rating: 4.8,
      reviewCount: 2,
      verified: true,
      verificationBadges: ["community"],
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
      logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
      hours: { summary: "Open until 6 PM", mon: "7am-6pm", sat: "8am-4pm" },
    },
  });

  const landscaping = await prisma.business.create({
    data: {
      communityId: community.id,
      ownerId: businessOwner.id,
      name: "Green Thumb Landscaping",
      description: "Full-service landscaping, lawn care, and seasonal cleanup.",
      category: "home",
      categories: ["Landscaping", "Lawn Care"],
      address: "88 Garden Way, Oak Hills",
      phone: "(555) 345-6789",
      lat: 37.776,
      lng: -122.418,
      rating: 4.5,
      reviewCount: 1,
      verified: true,
      verificationBadges: ["community", "license"],
      imageUrl: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=400&q=80",
      pricingRange: "$$",
    },
  });

  await prisma.businessAnalytics.createMany({
    data: [
      { businessId: bakery.id, viewCount: 234, inquiryCount: 12, listingViews: 0 },
      { businessId: landscaping.id, viewCount: 89, inquiryCount: 5, listingViews: 0 },
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        businessId: bakery.id,
        name: "Custom cake orders",
        category: "food",
        priceFrom: 35,
        priceTo: 120,
        availability: "Order 48h ahead",
      },
      {
        businessId: landscaping.id,
        name: "Weekly lawn maintenance",
        category: "home",
        priceFrom: 45,
        priceTo: 85,
        availability: "Mon–Fri",
        serviceRadiusM: 5000,
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      {
        businessId: bakery.id,
        authorId: resident.id,
        rating: 5,
        comment: "Best sourdough in the neighborhood. Friendly staff every morning.",
        verifiedCustomer: true,
        categoryRatings: { quality: 5, value: 4, professionalism: 5 },
      },
      {
        businessId: bakery.id,
        authorId: sarah.id,
        rating: 5,
        comment: "Their weekend croissants are incredible. Highly recommend.",
      },
      {
        businessId: landscaping.id,
        authorId: resident.id,
        rating: 4,
        comment: "Did a great job on our front yard. Fair pricing and on time.",
        ownerResponse: "Thank you Alex! Glad you love the new landscaping.",
        ownerRespondedAt: new Date(),
      },
    ],
  });

  const listings = await Promise.all([
    prisma.marketplaceListing.create({
      data: {
        communityId: community.id,
        sellerId: resident.id,
        title: "Patio Furniture Set",
        description: "Barely used 4-piece patio set. Table + 4 chairs. Pick up only.",
        price: 200,
        type: "FOR_SALE",
        category: "BUY_SELL",
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
        lat: 37.773,
        lng: -122.421,
        locationLabel: "Oak Hills",
        viewCount: 42,
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        communityId: community.id,
        sellerId: sarah.id,
        title: "Dog Walker Needed — 3x/week",
        description: "Friendly golden retriever, 30-min walks preferred after 3 PM.",
        price: 20,
        type: "JOB",
        category: "GIG",
        lat: 37.775,
        lng: -122.419,
        locationLabel: "Cedar Park",
        viewCount: 28,
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        communityId: community.id,
        sellerId: james.id,
        title: "Free Moving Boxes",
        description: "About 20 medium boxes from recent move. First come first served.",
        price: 0,
        type: "FOR_SALE",
        category: "CLASSIFIEDS",
        promoted: true,
        lat: 37.772,
        lng: -122.423,
        locationLabel: "Oak Hills",
        viewCount: 156,
      },
    }),
  ]);

  const job = await prisma.jobListing.create({
    data: {
      communityId: community.id,
      posterId: businessOwner.id,
      businessId: bakery.id,
      title: "Part-time Barista",
      description: "Weekend shifts at Oak Street Bakery. Prior coffee experience preferred.",
      jobType: "PART_TIME",
      salaryMin: 18,
      salaryMax: 22,
      salaryUnit: "hour",
      skills: ["customer service", "coffee"],
      location: "12 Oak St",
      lat: 37.774,
      lng: -122.42,
    },
  });

  await prisma.inquiry.create({
    data: {
      userId: sarah.id,
      businessId: landscaping.id,
      message: "Looking for a quote on spring cleanup for a 0.25 acre lot.",
      quoteRequest: true,
      status: "NEW",
    },
  });

  await prisma.favorite.createMany({
    data: [
      { userId: resident.id, targetType: "LISTING", targetId: listings[0].id },
      { userId: resident.id, targetType: "BUSINESS", targetId: bakery.id },
      { userId: sarah.id, targetType: "JOB", targetId: job.id },
    ],
    skipDuplicates: true,
  });

  await prisma.verificationRequest.create({
    data: {
      businessId: landscaping.id,
      type: "LICENSE",
      status: "APPROVED",
      documents: ["/uploads/license-placeholder.pdf"],
      reviewedAt: new Date(),
    },
  });

  // ─── Phase 7: Enterprise admin ─────────────────────────────────────────────

  const org = await prisma.organization.upsert({
    where: { slug: "oak-hills-org" },
    update: {},
    create: {
      name: "Oak Hills Municipal Alliance",
      slug: "oak-hills-org",
      type: "HOA",
      settings: { tier: "enterprise" },
    },
  });

  await prisma.community.update({
    where: { id: community.id },
    data: {
      organizationId: org.id,
      brandingColors: { primary: "#2563eb", accent: "#0ea5e9" },
      settings: { features: ["hoa", "ops", "moderation"] },
    },
  });

  const hoaManager = await prisma.user.upsert({
    where: { email: "hoa@communityconnect.app" },
    update: { role: "HOA_MANAGER" },
    create: {
      email: "hoa@communityconnect.app",
      passwordHash,
      role: "HOA_MANAGER",
      verified: true,
      profile: { create: { displayName: "HOA Board", badges: ["HOA Manager"] } },
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatch@communityconnect.app" },
    update: { role: "DISPATCHER" },
    create: {
      email: "dispatch@communityconnect.app",
      passwordHash,
      role: "DISPATCHER",
      verified: true,
      profile: { create: { displayName: "Dispatch Center", badges: ["Dispatch"] } },
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@communityconnect.app" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "super@communityconnect.app",
      passwordHash,
      role: "SUPER_ADMIN",
      verified: true,
      profile: { create: { displayName: "Super Admin", badges: ["Platform"] } },
    },
  });

  for (const [user, role] of [
    [hoaManager, "HOA_MANAGER"],
    [dispatcher, "DISPATCHER"],
    [superAdmin, "SUPER_ADMIN"],
  ] as const) {
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: user.id } },
      update: { role },
      create: { communityId: community.id, userId: user.id, role },
    });
  }

  const permDefs = [
    { key: "posts:moderate", resource: "posts", action: "moderate", scope: "COMMUNITY" as const },
    { key: "alerts:publish", resource: "alerts", action: "publish", scope: "COMMUNITY" as const },
    { key: "admin:analytics", resource: "admin", action: "analytics", scope: "GLOBAL" as const },
    { key: "hoa:vote", resource: "hoa", action: "vote", scope: "COMMUNITY" as const },
    { key: "moderation:queue", resource: "moderation", action: "queue", scope: "COMMUNITY" as const },
    { key: "users:suspend", resource: "users", action: "suspend", scope: "GLOBAL" as const },
    { key: "ops:dispatch", resource: "ops", action: "dispatch", scope: "COMMUNITY" as const },
  ];

  for (const d of permDefs) {
    await prisma.permission.upsert({
      where: { key: d.key },
      update: {},
      create: d,
    });
  }

  const modPerm = await prisma.permission.findUnique({ where: { key: "moderation:queue" } });
  if (modPerm) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: "MODERATOR", permissionId: modPerm.id } },
      update: {},
      create: { role: "MODERATOR", permissionId: modPerm.id },
    });
  }

  await prisma.moderationCase.createMany({
    data: [
      {
        communityId: community.id,
        entityType: "POST",
        entityId: post1.id,
        reporterId: resident.id,
        aiConfidence: 0.78,
        status: "OPEN",
        internalNotes: "AI placeholder: possible spam pattern",
      },
      {
        communityId: community.id,
        entityType: "LISTING",
        entityId: listings[0].id,
        status: "ASSIGNED",
        assignedModeratorId: admin.id,
        aiConfidence: 0.55,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        communityId: community.id,
        creatorId: admin.id,
        assigneeId: publicSafety.id,
        title: "Review suspicious vehicle report",
        priority: "HIGH",
        status: "IN_PROGRESS",
        entityType: "report",
        entityId: "seed-report",
      },
      {
        communityId: community.id,
        creatorId: hoaManager.id,
        title: "Schedule pool maintenance follow-up",
        priority: "MEDIUM",
        status: "OPEN",
      },
    ],
  });

  await prisma.workflowCase.createMany({
    data: [
      {
        communityId: community.id,
        type: "SAFETY",
        status: "IN_PROGRESS",
        title: "Streetlight outage cluster",
        entityType: "report",
      },
      {
        communityId: community.id,
        type: "HOA",
        status: "NEW",
        title: "Playground vote follow-up",
      },
    ],
  });

  const openVote = await prisma.vote.create({
    data: {
      communityId: community.id,
      title: "New playground equipment",
      description: "Approve budget for playground upgrade",
      options: ["Approve", "Reject", "Defer"],
      status: "OPEN",
      anonymous: false,
      isBoardElection: false,
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.voteBallot.create({
    data: { voteId: openVote.id, userId: resident.id, optionIndex: 0 },
  });

  await prisma.meeting.create({
    data: {
      communityId: community.id,
      title: "Board meeting — June 5",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "Community center",
      minutesUrl: "/uploads/minutes-placeholder.pdf",
    },
  });

  await prisma.communityRule.create({
    data: {
      communityId: community.id,
      title: "Quiet hours",
      content: "10 PM – 7 AM daily. Exceptions for emergencies.",
      category: "noise",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      communityId: community.id,
      requesterId: resident.id,
      title: "Pool gate latch broken",
      description: "Latch does not secure — safety concern for children.",
      location: "Community pool",
      status: "SUBMITTED",
    },
  });

  const template = await prisma.notificationTemplate.upsert({
    where: { key: "community-advisory" },
    update: {},
    create: {
      key: "community-advisory",
      name: "Community Advisory",
      subject: "Community Advisory",
      body: "{{body}}",
      channels: { push: true, email: true, sms: false },
    },
  });

  await prisma.broadcast.create({
    data: {
      communityId: community.id,
      title: "Welcome to Oak Hills Connect",
      body: "Enterprise notifications are active for this community.",
      severity: "INFO",
      templateId: template.id,
      status: "SENT",
      sentAt: new Date(),
      channels: { push: true, email: true },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyCommunityMetrics.upsert({
    where: { communityId_date: { communityId: community.id, date: today } },
    update: {},
    create: {
      communityId: community.id,
      date: today,
      counts: { posts: 6, members: 8, listings: 3 },
    },
  });

  await prisma.dailySafetyMetrics.upsert({
    where: { communityId_date: { communityId: community.id, date: today } },
    update: {},
    create: {
      communityId: community.id,
      date: today,
      counts: { alerts: alerts.length, reports: 2, critical: 1 },
    },
  });

  // ─── Phase 10: Engagement & Lifestyle ──────────────────────────────────────
  await prisma.communityGroup.deleteMany({ where: { communityId: community.id } });
  await prisma.localDeal.deleteMany({ where: { communityId: community.id } });
  await prisma.newsArticle.deleteMany({ where: { communityId: community.id } });
  await prisma.communityChallenge.deleteMany({ where: { communityId: community.id } });
  await prisma.trendingItem.deleteMany({ where: { communityId: community.id } });

  const runnersGroup = await prisma.communityGroup.create({
    data: {
      communityId: community.id,
      name: "Oak Hills Runners",
      category: "Fitness",
      description: "Morning jogs and weekend 5Ks",
      memberCount: 142,
      isPrivate: false,
    },
  });

  const parentsGroup = await prisma.communityGroup.create({
    data: {
      communityId: community.id,
      name: "Parents of Oak Hills",
      category: "Family",
      description: "Playdates, school updates, kid-friendly events",
      memberCount: 312,
      isPrivate: false,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { userId: resident.id, groupId: runnersGroup.id, role: "MEMBER" },
      { userId: sarah.id, groupId: runnersGroup.id, role: "MODERATOR" },
      { userId: resident.id, groupId: parentsGroup.id, role: "MODERATOR" },
    ],
  });

  await prisma.groupPost.create({
    data: {
      groupId: runnersGroup.id,
      postId: post1.id,
      content: "Cross-post from community feed",
    },
  });

  const deal1 = await prisma.localDeal.create({
    data: {
      communityId: community.id,
      businessId: bakery.id,
      title: "20% Off Pastries",
      description: "Valid on all baked goods before 10 AM weekdays",
      discount: "20% off",
      dealType: "PERCENTAGE",
      expiresAt: new Date(Date.now() + 7 * 86400000),
      redeemedCount: 47,
    },
  });

  await prisma.localDeal.create({
    data: {
      communityId: community.id,
      businessId: landscaping.id,
      title: "Free Lawn Consultation",
      description: "First-time customers get a free 30-min assessment",
      discount: "Free",
      dealType: "FREEBIE",
      expiresAt: new Date(Date.now() + 14 * 86400000),
      redeemedCount: 12,
    },
  });

  await prisma.savedDeal.create({
    data: { userId: resident.id, dealId: deal1.id },
  });

  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { key: "first_post" },
      update: {},
      create: {
        key: "first_post",
        title: "First Post",
        description: "Share your first community post",
        icon: "📝",
        points: 10,
      },
    }),
    prisma.achievement.upsert({
      where: { key: "week_streak" },
      update: {},
      create: {
        key: "week_streak",
        title: "Week Warrior",
        description: "7-day check-in streak",
        icon: "🔥",
        points: 50,
      },
    }),
    prisma.achievement.upsert({
      where: { key: "local_hero" },
      update: {},
      create: {
        key: "local_hero",
        title: "Local Hero",
        description: "Complete a community challenge",
        icon: "🏆",
        points: 100,
      },
    }),
  ]);

  await prisma.communityPoints.upsert({
    where: { userId: resident.id },
    update: { balance: 1240, level: 5 },
    create: { userId: resident.id, balance: 1240, level: 5 },
  });

  await prisma.communityPoints.upsert({
    where: { userId: sarah.id },
    update: { balance: 3420, level: 8 },
    create: { userId: sarah.id, balance: 3420, level: 8 },
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.dailyCheckIn.createMany({
    data: [
      { userId: resident.id, date: yesterday, streak: 6 },
      { userId: resident.id, date: today, streak: 7 },
    ],
    skipDuplicates: true,
  });

  await prisma.userAchievement.createMany({
    data: [
      { userId: resident.id, achievementId: achievements[0].id },
      { userId: resident.id, achievementId: achievements[1].id },
    ],
    skipDuplicates: true,
  });

  await prisma.pointTransaction.createMany({
    data: [
      { userId: resident.id, amount: 10, reason: "CHECK_IN" },
      { userId: resident.id, amount: 50, reason: "CHALLENGE" },
      { userId: sarah.id, amount: 100, reason: "ACHIEVEMENT" },
    ],
  });

  const cleanupChallenge = await prisma.communityChallenge.create({
    data: {
      communityId: community.id,
      title: "Neighborhood Cleanup Week",
      description: "Pick up litter and beautify our streets",
      endDate: new Date(Date.now() + 14 * 86400000),
      participantCount: 89,
      milestone: 500,
    },
  });

  await prisma.challengeParticipation.create({
    data: { userId: resident.id, challengeId: cleanupChallenge.id, progress: 3 },
  });

  await prisma.newsArticle.createMany({
    data: [
      {
        communityId: community.id,
        title: "City Council Approves New Park Funding",
        source: "Oak Hills Tribune",
        summary: "A $2.4M package will expand Cedar Park playground by fall.",
        category: "Local Government",
        publishedAt: new Date(Date.now() - 3600000),
      },
      {
        communityId: community.id,
        title: "Weekend Weather: Sunny Skies Expected",
        source: "Bay Area Weather",
        summary: "Highs near 78°F — ideal for outdoor events.",
        category: "Weather",
        publishedAt: new Date(Date.now() - 7200000),
      },
    ],
  });

  await prisma.userInterest.createMany({
    data: [
      { userId: resident.id, topic: "events" },
      { userId: resident.id, topic: "deals" },
      { userId: resident.id, topic: "family" },
    ],
    skipDuplicates: true,
  });

  await prisma.personalizationProfile.upsert({
    where: { userId: resident.id },
    update: { interests: ["events", "deals", "family"], preferences: { feedDensity: "normal" } },
    create: {
      userId: resident.id,
      interests: ["events", "deals", "family"],
      preferences: { feedDensity: "normal" },
    },
  });

  await prisma.trendingItem.createMany({
    data: [
      { communityId: community.id, entityType: "POST", entityId: post1.id, score: 98, period: "DAY" },
      { communityId: community.id, entityType: "DEAL", entityId: deal1.id, score: 92, period: "DAY" },
      { communityId: community.id, entityType: "GROUP", entityId: parentsGroup.id, score: 85, period: "DAY" },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: "community.settings.update",
        resource: "community",
        resourceId: community.id,
        communityId: community.id,
        organizationId: org.id,
        metadata: { phase: 7 },
        ip: "127.0.0.1",
      },
      {
        actorId: superAdmin.id,
        action: "permission.seed",
        resource: "permission",
        metadata: { count: permDefs.length },
      },
    ],
  });

  await prisma.auditLogRetention.create({
    data: { organizationId: org.id, retentionDays: 365 },
  });

  console.log("Seed complete (Phase 10).");
  console.log("Community:", community.slug, "| Org:", org.slug);
  console.log("Alerts:", alerts.length, "| Listings:", listings.length, "| Mod cases: 2");
  console.log("Engagement: groups, deals, challenges, points seeded for demo users");
  console.log("Demo login: demo@communityconnect.app / Demo1234!");
  console.log("Resident:   resident@communityconnect.app / Demo1234!");
  console.log("Business:   business@communityconnect.app / Demo1234!");
  console.log("Safety:     safety@communityconnect.app / Demo1234!");
  console.log("HOA:        hoa@communityconnect.app / Demo1234!");
  console.log("Dispatch:   dispatch@communityconnect.app / Demo1234!");
  console.log("Super:      super@communityconnect.app / Demo1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
