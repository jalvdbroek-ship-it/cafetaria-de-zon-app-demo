import { html, $, $$ } from "../lib/dom.js";
import { formatEuro } from "../lib/money.mjs";
import { validateSelection, unitPrice, MAX_QTY } from "../lib/cart.mjs";
import { icon, illustration } from "./icons.js";

export const needsChoice = (app, p) => (p.opties || []).some((g) => app.data.idx.groups.get(g)?.verplicht);
export const catOf = (menu, p) => menu.categorieen.find((c) => c.id === p.categorie);

export function photo(app, id, { cls = "", eager = false } = {}) {
  const info = app.fotos?.[id];
  if (!info) return html``;
  return html`<figure class="photo ${cls}"><img src="public/img/foto/${id}-800.webp" alt="${info.alt}" width="800" height="450" ${eager ? "" : 'loading="lazy"'} decoding="async" ${eager ? 'fetchpriority="high"' : ""}>${info.voorbeeld ? html`<figcaption>Voorbeeldfoto</figcaption>` : ""}</figure>`;
}

export function productRow(app, p) {
  const cat = catOf(app.data.menu, p);
  const hasOptions = (p.opties || []).length > 0;
  const choose = needsChoice(app, p);
  return html`
    <li class="prod ${p.uitverkocht ? "is-out" : ""}">
      <button class="prod-main" data-open="${p.id}" aria-label="${p.naam}, ${formatEuro(p.prijs)}${p.uitverkocht ? ", uitverkocht" : ""}. Bekijk details">
        ${illustration(cat?.illustratie, "ill tile")}
        <span class="prod-text">
          <span class="prod-name">${p.naam}</span>
          ${p.omschrijving ? html`<span class="prod-desc">${p.omschrijving}</span>` : ""}
          ${p.uitverkocht ? html`<span class="pill uit">Uitverkocht</span>` : ""}
        </span>
        <span class="prod-price num">${hasOptions ? "vanaf " : ""}${formatEuro(p.prijs)}</span>
      </button>
      <button class="prod-add" data-add="${p.id}" ${p.uitverkocht ? "disabled" : ""} aria-label="${choose ? `Kies opties voor ${p.naam}` : `Voeg ${p.naam} toe aan je mandje`}">${icon("plus")}</button>
    </li>`;
}

export function bindProducts(root, app) {
  const onClick = (e) => {
    const open = e.target.closest("[data-open]");
    const add = e.target.closest("[data-add]");
    if (open) return openProductSheet(app, open.dataset.open);
    if (!add || add.disabled) return;
    const p = app.data.idx.products.get(add.dataset.add);
    if (!p) return;
    if (needsChoice(app, p)) return openProductSheet(app, p.id);
    if (app.dispatch({ type: "add", productId: p.id, selection: {} })) {
      app.toast(`${p.naam} toegevoegd`);
      add.classList.remove("pop"); void add.offsetWidth; add.classList.add("pop");
    }
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

function readSelection(form, groups) {
  const sel = {};
  for (const g of groups) sel[g.id] = $$(`input[name="${g.id}"]:checked`, form).map((i) => i.value);
  return sel;
}

export async function openProductSheet(app, id) {
  const { idx } = app.data;
  const p = idx.products.get(id);
  if (!p) return;
  const groups = (p.opties || []).map((g) => idx.groups.get(g)).filter(Boolean);
  const fav = (await app.ds.getFavorites()).includes(id);
  let qty = 1;
  const content = html`
    <div class="spread"><h2>${p.naam}</h2><button class="icon-btn" data-close aria-label="Sluiten">${icon("x")}</button></div>
    ${p.omschrijving ? html`<p class="muted">${p.omschrijving}</p>` : ""}
    <p class="small"><span class="pill voorbeeld">Voorbeeldprijs</span></p>
    ${p.uitverkocht ? html`<p><span class="pill uit">Uitverkocht</span> Dit product kun je nu niet bestellen.</p>` : ""}
    <form class="stack" id="prod-form" novalidate>
      ${groups.map((g) => html`
        <fieldset class="opt-group" data-group="${g.id}">
          <legend>${g.naam} <span class="muted small">${g.verplicht ? "Kies er één" : g.type === "single" ? "Optioneel" : `Optioneel, max ${g.max ?? g.opties.length}`}</span></legend>
          ${g.opties.map((o) => html`<label class="check"><input type="${g.type === "single" ? "radio" : "checkbox"}" name="${g.id}" value="${o.id}"><span class="grow">${o.naam}</span><span class="num muted">${o.prijs ? `+ ${formatEuro(o.prijs)}` : ""}</span></label>`)}
          <p class="field-error" data-err="${g.id}" role="alert"></p>
        </fieldset>`)}
      <div class="row spread">
        <div class="stepper" role="group" aria-label="Aantal">
          <button type="button" class="icon-btn" data-q="-1" aria-label="Minder">${icon("minus")}</button>
          <output class="num" id="q" aria-live="polite">1</output>
          <button type="button" class="icon-btn" data-q="1" aria-label="Meer">${icon("plus")}</button>
        </div>
        <button type="button" class="icon-btn" data-fav aria-pressed="${fav}" aria-label="${fav ? "Verwijder uit favorieten" : "Zet in favorieten"}">${icon("heart")}</button>
      </div>
      <button class="btn block" type="submit" id="add-btn" ${p.uitverkocht ? "disabled" : ""}>Toevoegen <span class="num" id="add-total"></span></button>
    </form>`;
  app.openSheet(content, {
    label: p.naam,
    onMount(sheet) {
      const form = $("#prod-form", sheet);
      const total = () => {
        const sel = readSelection(form, groups);
        $("#add-total", sheet).textContent = `· ${formatEuro(unitPrice(p, idx.groups, sel) * qty)}`;
      };
      total();
      form.addEventListener("change", total);
      form.addEventListener("click", async (e) => {
        const q = e.target.closest("[data-q]");
        if (q) { qty = Math.min(MAX_QTY, Math.max(1, qty + Number(q.dataset.q))); $("#q", sheet).textContent = qty; total(); }
        const f = e.target.closest("[data-fav]");
        if (f) {
          const now = (await app.ds.toggleFavorite(id)).includes(id);
          f.setAttribute("aria-pressed", now); f.setAttribute("aria-label", now ? "Verwijder uit favorieten" : "Zet in favorieten");
          app.toast(now ? "Bij favorieten gezet" : "Uit favorieten gehaald");
        }
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const sel = readSelection(form, groups);
        const bad = validateSelection(p, idx.groups, sel);
        $$("[data-err]", form).forEach((n) => (n.textContent = ""));
        if (bad.length) {
          for (const gid of bad) { const n = $(`[data-err="${gid}"]`, form); if (n) n.textContent = `Kies een geldige optie bij ${idx.groups.get(gid)?.naam.toLowerCase()}.`; }
          $(`[name="${bad[0]}"]`, form)?.focus();
          return;
        }
        if (app.dispatch({ type: "add", productId: id, selection: sel, qty })) { app.closeSheet(); app.toast(`${qty}× ${p.naam} toegevoegd`); }
      });
    },
  });
}
