const fmt = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export const formatEuro = (cents) => fmt.format(cents / 100);
export const toCents = (euro) => Math.round(euro * 100 + Number.EPSILON * Math.sign(euro));

export function parseEuroInput(text) {
  const s = String(text ?? "").replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return toCents(Number(s));
}
