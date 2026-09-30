
import { Resend } from "resend";

let resend: Resend | null = null;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(input: { to: string[]; subject: string; html: string; text: string; tags?: { name: string; value: string }[] }) {
  if (!emailConfigured()) throw new Error("RESEND_API_KEY / RESEND_FROM_EMAIL are not set");
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    tags: input.tags,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data?.id ?? null;
}
