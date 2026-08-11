import { Resend } from "resend";
import { config } from "../config.js";
import { log } from "../util/logger.js";
import type { Rendered } from "./template.js";

export type SendResult =
  | { ok: true; id: string; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

export async function sendEmail(rendered: Rendered, opts: { dryRun: boolean }): Promise<SendResult> {
  if (opts.dryRun) {
    log.info("dry-run: not sending email", { subject: rendered.subject });
    return { ok: true, skipped: true, reason: "dry-run" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const resend = new Resend(apiKey);
  try {
    const res = await resend.emails.send({
      from: config.email.fromAddress,
      to: config.recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (res.error) {
      return { ok: false, error: JSON.stringify(res.error) };
    }
    return { ok: true, id: res.data?.id ?? "unknown" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
