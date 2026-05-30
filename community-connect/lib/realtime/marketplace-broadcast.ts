import "server-only";
import { emitToCommunity, emitToUser, SOCKET_EVENTS } from "./emit";

export function broadcastListingNew(communityId: string, listing: unknown) {
  emitToCommunity(communityId, SOCKET_EVENTS.LISTING_NEW, listing);
  emitToCommunity(communityId, SOCKET_EVENTS.MAP_MARKER_UPDATE, {
    action: "add",
    marker: listing,
  });
}

export function broadcastListingUpdate(communityId: string, listing: unknown) {
  emitToCommunity(communityId, SOCKET_EVENTS.LISTING_UPDATE, listing);
}

export function broadcastListingSold(communityId: string, listing: unknown) {
  emitToCommunity(communityId, SOCKET_EVENTS.LISTING_SOLD, listing);
}

export function broadcastReviewNew(communityId: string, review: unknown) {
  emitToCommunity(communityId, SOCKET_EVENTS.REVIEW_NEW, review);
}

export function broadcastInquiryNew(businessOwnerId: string, inquiry: unknown) {
  emitToUser(businessOwnerId, SOCKET_EVENTS.INQUIRY_NEW, inquiry);
}

export function broadcastBusinessActivity(communityId: string, payload: unknown) {
  emitToCommunity(communityId, SOCKET_EVENTS.BUSINESS_ACTIVITY, payload);
}
