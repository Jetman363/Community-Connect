/**
 * Curated Unsplash URLs for Community Connect demo UI.
 * License: https://unsplash.com/license (free for commercial use, no download required).
 */

const BASE = "https://images.unsplash.com";

export function unsplashPhoto(
  photoId: string,
  opts?: { w?: number; h?: number; q?: number; fit?: "crop" | "max" }
): string {
  const params = new URLSearchParams({
    w: String(opts?.w ?? 800),
    q: String(opts?.q ?? 80),
    auto: "format",
    fit: opts?.fit ?? "crop",
  });
  if (opts?.h) params.set("h", String(opts.h));
  return `${BASE}/photo-${photoId}?${params}`;
}

/** Photo IDs grouped by theme */
const ids = {
  heroNeighborhood: "1449824913935-59a10b8d2000",
  heroSuburb: "1560518883-ce09059eeffa",
  communityGathering: "1519501025264-65ba15a82390",
  neighborsTalking: "1529156069898-49953e39b3ac",
  diverseNeighbors: "1573496359142-b8d87734a5a2",
  parkPath: "1441974231531-c6227db76b6e",
  communityCenter: "1560448204-e02f11c2d0e2",
  townSquare: "1540970417591-0a7b15bd1e7a",
  aerialNeighborhood: "1524661135-423995f22d0b",
  safetyBriefing: "1454165804606-c3d57bc86b40",
  emergencyLights: "1581578731546-5eeb39199b8a",
  farmersMarket: "1488459716781-31db52582fe9",
  blockParty: "1530103862676-de8c9debad1d",
  artWalk: "1460661419341-fba6b3120b67",
  youthSoccer: "1574623453776-8e9e5e9c6f0f",
  neighborhoodWatch: "1551836022-d5d88e4c4f8e",
  bakery: "1509440159596-0249088772ff",
  landscaping: "1558904541-efa843a96f01",
  autoShop: "1486262715619-259725e85193",
  clinic: "1519494026892-80bbd2d6fd0d",
  legalOffice: "1589829545856-d10d55769e0f",
  cornerStore: "1604719312566-8912a7ac4a2a",
  cleanupVolunteers: "1532996122724-e3c354a0b782",
  goldenRetriever: "1558787533-047468462f99",
  patioFurniture: "1600585154340-be6161a56a0c",
  kidsBike: "1558618666-fcd25c85cd64",
  guitar: "1516927509638-f98654e654d0",
  hoaMeeting: "1517245386807-bb43f782c4fb",
} as const;

export const communityPhotos = {
  hero: {
    landing: unsplashPhoto(ids.heroNeighborhood, { w: 1920, h: 1080 }),
    landingSide: unsplashPhoto(ids.communityGathering, { w: 800, h: 1000 }),
    auth: unsplashPhoto(ids.neighborsTalking, { w: 1200, h: 1600 }),
    dashboard: unsplashPhoto(ids.parkPath, { w: 1600, h: 400 }),
    profile: unsplashPhoto(ids.heroSuburb, { w: 1200, h: 320 }),
    alerts: unsplashPhoto(ids.safetyBriefing, { w: 1200, h: 280 }),
    events: unsplashPhoto(ids.farmersMarket, { w: 1200, h: 280 }),
    services: unsplashPhoto(ids.cornerStore, { w: 1200, h: 280 }),
    hoa: unsplashPhoto(ids.communityCenter, { w: 1200, h: 280 }),
    marketplace: unsplashPhoto(ids.patioFurniture, { w: 1200, h: 280 }),
  },
  safety: {
    banner: unsplashPhoto(ids.emergencyLights, { w: 800, h: 400 }),
    meeting: unsplashPhoto(ids.neighborhoodWatch, { w: 800 }),
  },
  events: {
    farmersMarket: unsplashPhoto(ids.farmersMarket, { w: 800 }),
    blockParty: unsplashPhoto(ids.blockParty, { w: 800 }),
    artWalk: unsplashPhoto(ids.artWalk, { w: 800 }),
    youthSoccer: unsplashPhoto(ids.youthSoccer, { w: 800 }),
    neighborhoodWatch: unsplashPhoto(ids.neighborhoodWatch, { w: 800 }),
    communityGathering: unsplashPhoto(ids.communityGathering, { w: 800 }),
  },
  businesses: {
    bakery: unsplashPhoto(ids.bakery, { w: 600 }),
    landscaping: unsplashPhoto(ids.landscaping, { w: 600 }),
    autoShop: unsplashPhoto(ids.autoShop, { w: 600 }),
    clinic: unsplashPhoto(ids.clinic, { w: 600 }),
    legalOffice: unsplashPhoto(ids.legalOffice, { w: 600 }),
    cornerStore: unsplashPhoto(ids.cornerStore, { w: 600 }),
  },
  people: {
    neighbors: unsplashPhoto(ids.neighborsTalking, { w: 600 }),
    diverse: unsplashPhoto(ids.diverseNeighbors, { w: 600 }),
  },
  places: {
    park: unsplashPhoto(ids.parkPath, { w: 800 }),
    communityCenter: unsplashPhoto(ids.communityCenter, { w: 800 }),
    townSquare: unsplashPhoto(ids.townSquare, { w: 800 }),
    aerialMap: unsplashPhoto(ids.aerialNeighborhood, { w: 1200, h: 600 }),
  },
  feed: {
    cleanup: unsplashPhoto(ids.cleanupVolunteers, { w: 800 }),
    lostPet: unsplashPhoto(ids.goldenRetriever, { w: 800 }),
    marketplace: unsplashPhoto(ids.patioFurniture, { w: 800 }),
    safetyTip: unsplashPhoto(ids.safetyBriefing, { w: 800 }),
  },
  marketplace: {
    patio: unsplashPhoto(ids.patioFurniture, { w: 600 }),
    bike: unsplashPhoto(ids.kidsBike, { w: 600 }),
    guitar: unsplashPhoto(ids.guitar, { w: 600 }),
  },
  empty: {
    feed: unsplashPhoto(ids.communityGathering, { w: 400, h: 300 }),
    events: unsplashPhoto(ids.farmersMarket, { w: 400, h: 300 }),
    services: unsplashPhoto(ids.cornerStore, { w: 400, h: 300 }),
  },
} as const;

/** Map event category → cover photo */
export function eventCoverPhoto(category: string): string {
  const map: Record<string, string> = {
    market: communityPhotos.events.farmersMarket,
    community: communityPhotos.events.blockParty,
    safety: communityPhotos.events.neighborhoodWatch,
    sports: communityPhotos.events.youthSoccer,
    arts: communityPhotos.events.artWalk,
    family: communityPhotos.events.communityGathering,
  };
  return map[category] ?? communityPhotos.events.communityGathering;
}

/** Map business category → cover photo */
export function businessCoverPhoto(category: string): string {
  const map: Record<string, string> = {
    food: communityPhotos.businesses.bakery,
    home: communityPhotos.businesses.landscaping,
    automotive: communityPhotos.businesses.autoShop,
    health: communityPhotos.businesses.clinic,
    professional: communityPhotos.businesses.legalOffice,
    retail: communityPhotos.businesses.cornerStore,
  };
  return map[category] ?? communityPhotos.businesses.cornerStore;
}

/** Unsplash attribution (optional footer credit) */
export const imageAttribution = "Photos from Unsplash";
