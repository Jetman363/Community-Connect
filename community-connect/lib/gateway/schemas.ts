import { z } from "zod";

export const gatewayEventSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  communityId: z.string().optional(),
  organizationId: z.string().optional(),
});

export const gatewayWebhookRegisterSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).default([]),
  connectorSlug: z.string().min(1),
});

export type GatewayEventInput = z.infer<typeof gatewayEventSchema>;
export type GatewayWebhookRegisterInput = z.infer<typeof gatewayWebhookRegisterSchema>;
