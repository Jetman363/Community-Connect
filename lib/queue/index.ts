import "server-only";
import { logger } from "@/lib/observability/logger";

export type JobName = "sendNotification" | "processUpload" | "analyticsAggregate" | "sendEmail";

export interface JobPayload {
  sendNotification: { userId: string; title: string; body: string };
  processUpload: { fileId: string; userId: string };
  analyticsAggregate: { communityId: string; period: string };
  sendEmail: { to: string; subject: string; html: string };
}

type JobHandler<K extends JobName> = (payload: JobPayload[K]) => Promise<void>;

interface QueuedJob {
  id: string;
  name: JobName;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

const handlers = new Map<JobName, JobHandler<JobName>>();
const deadLetter: QueuedJob[] = [];
const inProcessQueue: QueuedJob[] = [];
let processing = false;
const bullAvailable = false;

const defaultHandlers: Partial<Record<JobName, JobHandler<JobName>>> = {
  sendNotification: async (p) => {
    logger.info("queue.sendNotification", p as Record<string, unknown>);
  },
  processUpload: async (p) => {
    logger.info("queue.processUpload", p as Record<string, unknown>);
  },
  analyticsAggregate: async (p) => {
    logger.info("queue.analyticsAggregate", p as Record<string, unknown>);
  },
  sendEmail: async (p) => {
    const { sendEmail } = await import("@/lib/email");
    const data = p as JobPayload["sendEmail"];
    await sendEmail({ to: data.to, subject: data.subject, html: data.html });
  },
};

for (const [name, handler] of Object.entries(defaultHandlers)) {
  handlers.set(name as JobName, handler as JobHandler<JobName>);
}

async function processInMemoryQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  while (inProcessQueue.length > 0) {
    const job = inProcessQueue.shift()!;
    const handler = handlers.get(job.name);
    if (!handler) continue;
    try {
      await handler(job.payload as JobPayload[typeof job.name]);
      logger.debug("queue.completed", { id: job.id, name: job.name });
    } catch (err) {
      job.attempts += 1;
      if (job.attempts >= job.maxAttempts) {
        deadLetter.push(job);
        logger.error("queue.deadLetter", {
          id: job.id,
          name: job.name,
          error: err instanceof Error ? err.message : String(err),
        });
      } else {
        inProcessQueue.push(job);
        logger.warn("queue.retry", { id: job.id, attempt: job.attempts });
      }
    }
  }
  processing = false;
}

export function registerJobHandler<K extends JobName>(name: K, handler: JobHandler<K>): void {
  handlers.set(name, handler as JobHandler<JobName>);
}

export async function enqueueJob<K extends JobName>(
  name: K,
  payload: JobPayload[K],
  opts: { maxAttempts?: number } = {}
): Promise<{ id: string; backend: "bullmq" | "memory" }> {
  const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const maxAttempts = opts.maxAttempts ?? 3;

  if (process.env.REDIS_URL?.trim() && bullAvailable) {
    // BullMQ integration point — enabled when REDIS_URL + bullmq worker deployed
    logger.debug("queue.bullmq.stub", { id, name });
  }

  inProcessQueue.push({ id, name, payload, attempts: 0, maxAttempts, createdAt: Date.now() });
  void processInMemoryQueue();
  return { id, backend: "memory" };
}

export function getQueueStatus() {
  return {
    backend: process.env.REDIS_URL?.trim() ? (bullAvailable ? "bullmq" : "memory-fallback") : "memory",
    pending: inProcessQueue.length,
    deadLetter: deadLetter.length,
    handlers: [...handlers.keys()],
  };
}

export function getDeadLetterJobs(): QueuedJob[] {
  return [...deadLetter];
}
