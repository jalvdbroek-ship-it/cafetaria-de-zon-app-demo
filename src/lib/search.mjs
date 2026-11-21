const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function matchesQuery(product, query) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = norm(`${product.naam} ${product.omschrijving || ""}`);
  return words.every((w) => hay.includes(w));
}
