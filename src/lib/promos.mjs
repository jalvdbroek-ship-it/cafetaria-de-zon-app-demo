import { amsterdamParts } from "./hours.mjs";

// Acties met optionele vanaf/tot (YYYY-MM-DD, Nederlandse datum, einddatum telt volledig mee).
export function activePromos(promos, now) {
  const t = amsterdamParts(now);
  const today = `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
  return promos.filter((p) => p.actief !== false && (!p.vanaf || p.vanaf <= today) && (!p.tot || p.tot >= today));
}
