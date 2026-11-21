// DataSource-contract voor de app. Nu: LocalDemoSource (JSON + localStorage, niets verlaat het toestel).
// Later: een HttpSource met dezelfde methoden (zie docs/API-CONTRACT.md); schermen hoeven niet te veranderen.
import { indexMenu, priceCart } from "./cart.mjs";
import { validateCheckout, normalizePhone } from "./validate.mjs";
import { pointsForOrder, balance, earn, redeemReward } from "./loyalty.mjs";

const P = "dezon.v1.";
const USER_KEYS = ["orders", "ledger", "vouchers", "account", "favorites", "cart", "card", "settings"];
const ADMIN_KEYS = ["admin.menu", "admin.promos", "admin.config", "admin.site"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class ValidationError extends Error {
  constructor(fields, message = "Controleer de gegevens.") {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const randomCode = (n = 4) => {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
};

export function menuProblem(menu) {
  if (!menu || typeof menu !== "object") return "Het menu ontbreekt.";
  const { categorieen, producten, optiegroepen } = menu;
  if (!Array.isArray(categorieen) || !Array.isArray(producten) || !Array.isArray(optiegroepen)) return "Het menu mist categorieen, producten of optiegroepen.";
  const cats = new Set();
  for (const c of categorieen) {
    if (!c || typeof c.id !== "string" || typeof c.naam !== "string") return "Een categorie in het menu klopt niet.";
    cats.add(c.id);
  }
  const groups = new Set();
  for (const g of optiegroepen) {
    if (!g || typeof g.id !== "string" || !Array.isArray(g.opties) || g.opties.some((o) => typeof o.id !== "string" || !Number.isInteger(o.prijs) || o.prijs < 0)) return "Een optiegroep in het menu klopt niet.";
    groups.add(g.id);
  }
  const ids = new Set();
  for (const p of producten) {
    if (!p || typeof p.id !== "string" || typeof p.naam !== "string" || !Number.isInteger(p.prijs) || p.prijs < 0 || p.prijs > 100000) return "Een product in het menu klopt niet (naam of prijs in centen).";
    if (ids.has(p.id)) return `Product-id "${p.id}" komt twee keer voor in het menu.`;
    ids.add(p.id);
    if (!cats.has(p.categorie)) return `Product "${p.naam}" heeft een onbekende categorie.`;
    if (!(p.opties || []).every((g) => groups.has(g))) return `Product "${p.naam}" verwijst naar een onbekende optiegroep.`;
  }
  return null;
}

export class LocalDemoSource {
  constructor({ menu, promos, config, site, storage, now = () => new Date() }) {
    this.base = { menu, promos, config, site };
    this.storage = storage;
    this.now = now;
  }

  #read(key, fallback) {
    try {
      const raw = this.storage.getItem(P + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  }
  #write(key, value) { this.storage.setItem(P + key, JSON.stringify(value)); }

  async getMenu() { return clone(this.#read("admin.menu", this.base.menu)); }
  async getPromos() { return clone(this.#read("admin.promos", this.base.promos)); }
  async getConfig() { return clone({ ...this.base.config, ...this.#read("admin.config", {}) }); }
  async getSite() { return clone({ ...this.base.site, ...this.#read("admin.site", {}) }); }

  async saveMenu(menu) {
    const problem = menuProblem(menu);
    if (problem) throw new Error(problem);
    this.#write("admin.menu", menu);
  }
  async savePromos(promos) {
    if (!Array.isArray(promos)) throw new Error("Acties moeten een lijst zijn.");
    this.#write("admin.promos", promos);
  }
  async saveConfig(patch) { this.#write("admin.config", { ...this.#read("admin.config", {}), ...patch }); }
  async saveSite(patch) { this.#write("admin.site", { ...this.#read("admin.site", {}), ...patch }); }
  async checkPin(pin) { return String((await this.getConfig()).demoPin) === String(pin); }
  async resetAdmin() { for (const k of ADMIN_KEYS) this.storage.removeItem(P + k); }

  async exportAdmin() {
    const [menu, promos, config, site] = await Promise.all([this.getMenu(), this.getPromos(), this.getConfig(), this.getSite()]);
    return JSON.stringify({ versie: 1, menu, promos, config: { loyalty: config.loyalty, pickup: config.pickup }, site: { hours: site.hours } }, null, 2);
  }
  async importAdmin(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("Dit is geen geldig JSON-bestand."); }
    if (!data || typeof data !== "object") throw new Error("Dit is geen geldig JSON-bestand.");
    if (data.menu !== undefined) {
      const problem = menuProblem(data.menu);
      if (problem) throw new Error(`Menu: ${problem}`);
    }
    if (data.promos !== undefined && !Array.isArray(data.promos)) throw new Error("Acties moeten een lijst zijn.");
    if (data.menu !== undefined) await this.saveMenu(data.menu);
    if (data.promos !== undefined) await this.savePromos(data.promos);
    if (data.config) await this.saveConfig({ loyalty: data.config.loyalty, pickup: data.config.pickup });
    if (data.site?.hours) await this.saveSite({ hours: data.site.hours });
  }

  async placeOrder({ lines, customer, pickup }) {
    if (!lines?.length) throw new Error("De bestelling is leeg.");
    const fields = validateCheckout(customer || {});
    if (Object.keys(fields).length) throw new ValidationError(fields);
    if (!pickup || (!pickup.asap && Number.isNaN(Date.parse(pickup.at)))) throw new ValidationError({ pickup: "Kies een afhaalmoment." });
    const idx = indexMenu(await this.getMenu());
    const priced = priceCart({ lines }, idx);
    if (priced.unavailable.length) throw new Error("Een of meer producten zijn niet beschikbaar. Pas je mandje aan.");
    const config = await this.getConfig();
    const orders = this.#read("orders", []);
    let id;
    do { id = `DEMO-${randomCode()}`; } while (orders.some((o) => o.id === id));
    const now = this.now();
    const pointsEarned = pointsForOrder(priced.subtotal, config.loyalty);
    const order = {
      id, createdAt: now.toISOString(), demo: true, sentToShop: false,
      lines: priced.lines.map((l) => ({ productId: l.productId, selection: l.selection, naam: l.product.naam, qty: l.qty, unit: l.unit, total: l.total, optionNames: l.optionNames })),
      total: priced.subtotal,
      customer: { naam: customer.naam.trim(), telefoon: normalizePhone(customer.telefoon), email: (customer.email || "").trim(), opmerking: (customer.opmerking || "").trim() },
      pickup: pickup.asap ? { asap: true } : { asap: false, at: pickup.at, label: pickup.label || "" },
      pointsEarned,
    };
    this.#write("orders", [order, ...orders].slice(0, 50));
    this.#write("ledger", earn(this.#read("ledger", []), pointsEarned, now, id));
    return order;
  }
  async listOrders() { return this.#read("orders", []); }

  async getLoyalty() {
    const entries = this.#read("ledger", []);
    return { balance: balance(entries), entries: [...entries].reverse(), vouchers: this.#read("vouchers", []) };
  }
  async redeem(rewardId) {
    const config = await this.getConfig();
    const reward = config.loyalty.rewards.find((r) => r.id === rewardId);
    if (!reward) throw new Error("Onbekende beloning.");
    const code = `BON-${randomCode()}`;
    const now = this.now();
    this.#write("ledger", redeemReward(this.#read("ledger", []), reward, now, code));
    const voucher = { code, rewardId, naam: reward.naam, date: now.toISOString(), demo: true };
    this.#write("vouchers", [voucher, ...this.#read("vouchers", [])]);
    return voucher;
  }

  async getAccount() { return { naam: "", telefoon: "", email: "", ...this.#read("account", {}) }; }
  async saveAccount(a) {
    const fields = {};
    if (a.telefoon?.trim() && !/^0\d{9}$/.test(normalizePhone(a.telefoon))) fields.telefoon = "Dit lijkt geen Nederlands telefoonnummer.";
    if (a.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email.trim())) fields.email = "Dit e-mailadres lijkt niet te kloppen.";
    if ((a.naam || "").length > 60) fields.naam = "Maximaal 60 tekens.";
    if (Object.keys(fields).length) throw new ValidationError(fields);
    this.#write("account", { naam: (a.naam || "").trim(), telefoon: a.telefoon ? normalizePhone(a.telefoon) : "", email: (a.email || "").trim() });
  }
  async getSettings() { return { reduceMotion: this.#read("settings", {}).reduceMotion === true }; }
  async saveSettings(s) { this.#write("settings", { reduceMotion: s.reduceMotion === true }); }
  async getCardId() {
    let id = this.#read("card", null);
    if (!id) { id = `DEMO-KAART-${randomCode(6)}`; this.#write("card", id); }
    return id;
  }
  async getFavorites() { return this.#read("favorites", []); }
  async toggleFavorite(id) {
    const f = this.#read("favorites", []);
    const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
    this.#write("favorites", next);
    return next;
  }
  async clearAll() { for (const k of USER_KEYS) this.storage.removeItem(P + k); }

  loadCart() { return this.#read("cart", { lines: [] }); }
  saveCart(cart) { this.#write("cart", cart); }
}
