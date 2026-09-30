
/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Manual calls can use the same header. */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}
