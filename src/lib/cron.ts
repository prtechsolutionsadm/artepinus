import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Confere o "Authorization: Bearer $CRON_SECRET" das rotinas agendadas, em tempo constante. */
export function cronAutorizado(authorization: string | null) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || !authorization) return false;
  const a = Buffer.from(authorization);
  const b = Buffer.from(`Bearer ${segredo}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
