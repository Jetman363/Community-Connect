import "server-only";
import { logger } from "@/lib/observability/logger";
import { enqueueJob } from "@/lib/queue";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailProvider = "console" | "smtp" | "resend";

function getProvider(): EmailProvider {
  const p = process.env.EMAIL_PROVIDER as EmailProvider | undefined;
  return p ?? "console";
}

async function sendViaConsole(msg: EmailMessage): Promise<void> {
  logger.info("email.console", { to: msg.to, subject: msg.subject });
}

async function sendViaSmtp(msg: EmailMessage): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.warn("email.smtp.missing_config");
    return sendViaConsole(msg);
  }
  // Placeholder: wire nodemailer or native SMTP in production
  logger.info("email.smtp.stub", { host, to: msg.to, subject: msg.subject });
}

async function sendViaResend(msg: EmailMessage): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn("email.resend.missing_key");
    return sendViaConsole(msg);
  }
  // Placeholder: POST https://api.resend.com/emails
  logger.info("email.resend.stub", { to: msg.to, subject: msg.subject });
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const provider = getProvider();
  switch (provider) {
    case "smtp":
      return sendViaSmtp(msg);
    case "resend":
      return sendViaResend(msg);
    default:
      return sendViaConsole(msg);
  }
}

export async function queueEmail(msg: EmailMessage): Promise<{ id: string }> {
  const { id } = await enqueueJob("sendEmail", {
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  });
  return { id };
}

export function renderVerifyEmail(name: string, link: string): { subject: string; html: string } {
  return {
    subject: "Verify your Community Connect account",
    html: `<p>Hi ${name},</p><p>Please verify your email: <a href="${link}">${link}</a></p>`,
  };
}

export function renderPasswordReset(name: string, link: string): { subject: string; html: string } {
  return {
    subject: "Reset your Community Connect password",
    html: `<p>Hi ${name},</p><p>Reset your password: <a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  };
}

export function renderNotification(title: string, body: string): { subject: string; html: string } {
  return {
    subject: title,
    html: `<h2>${title}</h2><p>${body}</p>`,
  };
}
