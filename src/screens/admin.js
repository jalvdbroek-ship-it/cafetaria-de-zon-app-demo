import { html, $ } from "../lib/dom.js";
import { icon } from "../components/icons.js";

const SECTIONS = [
  ["producten", "Producten", () => import("./admin/products.js")],
  ["acties", "Acties", () => import("./admin/promos.js")],
  ["sparen", "Spaarregels", () => import("./admin/loyalty.js")],
  ["info", "Tijden", () => import("./admin/info.js")],
  ["bestellingen", "Bestellingen", () => import("./admin/orders.js")],
  ["data", "Export en reset", () => import("./admin/data.js")],
];
const KEY = "dezon.admin.unlocked";
const unlocked = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };

const warning = html`<p class="demo-banner" role="note"><span><strong>Demo-beheer, geen echte beveiliging</strong>De pincode staat in config/app.json en wijzigingen worden alleen op dit toestel bewaard. De Zon ziet ze niet.</span></p>`;

let sub = null;

export default {
  title: "Beheer (demo)",
  async render(app, section) {
    if (!unlocked()) {
      return html`<a class="link back" href="#/account">${icon("back")} Account</a><h1>Beheer</h1>${warning}
        <form id="pin" class="stack" novalidate>
          <div class="field"><label for="pin-in">Demo-pincode</label><input id="pin-in" type="password" inputmode="numeric" autocomplete="off" maxlength="12"><p class="field-error" id="e-pin" role="alert"></p></div>
          <button class="btn" type="submit">Ontgrendel</button>
        </form>`;
    }
    const cur = SECTIONS.find((s) => s[0] === section) || SECTIONS[0];
    sub = (await cur[2]()).default;
    return html`<a class="link back" href="#/account">${icon("back")} Account</a><h1>Beheer</h1>${warning}
      <nav class="chips" aria-label="Beheer-onderdelen">${SECTIONS.map(([id, label]) => html`<a class="chip" href="#/beheer/${id}" ${id === cur[0] ? 'aria-current="true"' : ""}>${label}</a>`)}</nav>
      <div id="adm">${await sub.render(app)}</div>
      <button class="link" id="lock">Vergrendel beheer</button>`;
  },
  mount(root, app) {
    const pin = $("#pin", root);
    if (pin) {
      pin.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (await app.ds.checkPin($("#pin-in", root).value)) { try { sessionStorage.setItem(KEY, "1"); } catch {} app.rerender({ focus: "h1" }); }
        else { $("#e-pin", root).textContent = "Deze pincode klopt niet."; $("#pin-in", root).setAttribute("aria-invalid", "true"); }
      });
      return;
    }
    $("#lock", root).addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch {} app.rerender({ focus: "h1" }); });
    return sub?.mount?.($("#adm", root), app);
  },
};
