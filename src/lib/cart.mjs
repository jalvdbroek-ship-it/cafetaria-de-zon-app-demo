export const MAX_QTY = 20;

export const emptyCart = () => ({ lines: [] });

export function indexMenu(menu) {
  return {
    products: new Map((menu.producten || []).map((p) => [p.id, p])),
    groups: new Map((menu.optiegroepen || []).map((g) => [g.id, g])),
  };
}

function cleanSelection(selection = {}) {
  const out = {};
  for (const [g, ids] of Object.entries(selection)) {
    const list = [...new Set(Array.isArray(ids) ? ids : [])].sort();
    if (list.length) out[g] = list;
  }
  return out;
}

export function lineKey(productId, selection) {
  const sel = cleanSelection(selection);
  return `${productId}|${Object.keys(sel).sort().map((g) => `${g}:${sel[g].join(",")}`).join(";")}`;
}

// Geeft de ids van groepen met een ongeldige keuze terug (leeg = alles in orde).
export function validateSelection(product, groups, selection = {}) {
  const sel = cleanSelection(selection);
  const bad = [];
  const allowed = new Set(product.opties || []);
  for (const gid of Object.keys(sel)) if (!allowed.has(gid)) bad.push(gid);
  for (const gid of allowed) {
    const g = groups.get(gid);
    if (!g) { bad.push(gid); continue; }
    const chosen = sel[gid] || [];
    const known = new Set(g.opties.map((o) => o.id));
    const max = g.type === "single" ? 1 : g.max ?? Infinity;
    if ((g.verplicht && !chosen.length) || chosen.length > max || chosen.some((id) => !known.has(id))) bad.push(gid);
  }
  return bad;
}

export function unitPrice(product, groups, selection = {}) {
  let cents = product.prijs;
  for (const [gid, ids] of Object.entries(cleanSelection(selection))) {
    const g = groups.get(gid);
    for (const id of ids) cents += g?.opties.find((o) => o.id === id)?.prijs ?? 0;
  }
  return cents;
}

export function cartReducer(state, action, idx) {
  const lines = state.lines;
  switch (action.type) {
    case "add": {
      const selection = cleanSelection(action.selection);
      if (idx) {
        const product = idx.products.get(action.productId);
        if (!product || product.uitverkocht) throw new Error("Dit product is uitverkocht of niet beschikbaar.");
        if (validateSelection(product, idx.groups, selection).length) throw new Error("De keuze is onvolledig of ongeldig.");
      }
      const key = lineKey(action.productId, selection);
      const qty = Math.max(1, Math.floor(action.qty ?? 1));
      const found = lines.find((l) => l.key === key);
      if (found) return { lines: lines.map((l) => (l === found ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) };
      return { lines: [...lines, { key, productId: action.productId, selection, qty: Math.min(MAX_QTY, qty) }] };
    }
    case "inc":
      return { lines: lines.map((l) => (l.key === action.key ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l)) };
    case "dec":
      return { lines: lines.flatMap((l) => (l.key !== action.key ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [])) };
    case "remove":
      return { lines: lines.filter((l) => l.key !== action.key) };
    case "clear":
      return emptyCart();
    default:
      return state;
  }
}

export function priceCart(state, idx) {
  const out = { lines: [], subtotal: 0, count: 0, unavailable: [] };
  for (const l of state.lines) {
    const product = idx.products.get(l.productId);
    const bad = !product || product.uitverkocht || validateSelection(product, idx.groups, l.selection).length > 0;
    if (bad) { out.unavailable.push(l.key); out.lines.push({ ...l, product: product || null, unavailable: true, unit: 0, total: 0, optionNames: [] }); continue; }
    const unit = unitPrice(product, idx.groups, l.selection);
    const optionNames = Object.entries(l.selection).flatMap(([gid, ids]) => ids.map((id) => idx.groups.get(gid).opties.find((o) => o.id === id).naam));
    out.lines.push({ ...l, product, unavailable: false, unit, total: unit * l.qty, optionNames });
    out.subtotal += unit * l.qty;
    out.count += l.qty;
  }
  return out;
}
