import type { EventHandler, IntegrationEvent } from "./types";

class EventBroker {
  private handlers = new Map<string, Set<EventHandler>>();
  private globalHandlers = new Set<EventHandler>();

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => this.handlers.get(eventType)?.delete(handler);
  }

  subscribeAll(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  async publish(event: IntegrationEvent): Promise<void> {
    const typeHandlers = this.handlers.get(event.type) ?? new Set();
    const all = [...typeHandlers, ...this.globalHandlers];
    await Promise.all(all.map((h) => Promise.resolve(h(event))));
  }

  async dispatchWebhooks(event: IntegrationEvent): Promise<void> {
    const { dispatchOutboundWebhooks } = await import("./webhook-manager");
    await dispatchOutboundWebhooks(event);
  }
}

let broker: EventBroker | null = null;

export function getEventBroker(): EventBroker {
  if (!broker) broker = new EventBroker();
  return broker;
}

export function resetEventBroker(): void {
  broker = null;
}
