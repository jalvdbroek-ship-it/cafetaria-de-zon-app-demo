import { html, $ } from "../../lib/dom.js";
import { formatEuro, parseEuroInput } from "../../lib/money.mjs";
import { confirmSheet } from "../../components/confirm.js";

const open = new Set();
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
const euro = (c) => (c / 100).toFixed(2).replace(".", ",");

export default {
  render(app) {
    const { menu } = app.data;
    return html`
      <p class="small muted">Prijzen en namen zijn voorbeelden. Zet "bevestigd" aan als De Zon de prijs heeft goedgekeurd.</p>
      <details class="adm" id="new"><summary><strong>Nieuw product</strong></summary>
        <form class="stack" id="new-form" novalidate>
          <div class="field"><label for="n-naam">Naam</label><input id="n-naam" name="naam" type="text" maxlength="60"></div>
          <div class="field"><label for="n-cat">Categorie</label><select id="n-cat" name="categorie">${menu.categorieen.map((c) => html`<option value="${c.id}">${c.naam}</option>`)}</select></div>
          <div class="field"><label for="n-prijs">Prijs in euro</label><input id="n-prijs" name="prijs" type="text" inputmode="decimal" placeholder="3,50"></div>
          <p class="field-error" id="n-err" role="alert"></p>
          <button class="btn" type="submit">Product toevoegen</button>
        </form></details>
      ${menu.categorieen.map((c) => html`<section class="stack"><h3>${c.naam}</h3>${menu.producten.filter((p) => p.categorie === c.id).map((p) => html`
        <details class="adm" data-id="${p.id}" ${open.has(p.id) ? "open" : ""}>
          <summary><span class="grow">${p.naam}</span><span class="num">${formatEuro(p.prijs)}</span>${p.uitverkocht ? html`<span class="pill uit">Uit</span>` : ""}</summary>
          <div class="stack">
            <div class="field"><label>Naam<input name="naam" type="text" maxlength="60" value="${p.naam}"></label></div>
            <div class="field"><label>Omschrijving<input name="omschrijving" type="text" maxlength="100" value="${p.omschrijving || ""}"></label></div>
            <div class="field"><label>Prijs in euro<input name="prijs" type="text" inputmode="decimal" value="${euro(p.prijs)}"></label></div>
            <label class="check"><input type="checkbox" name="uitverkocht" ${p.uitverkocht ? "checked" : ""}><span class="grow">Uitverkocht</span></label>
            <label class="check"><input type="checkbox" name="uitgelicht" ${p.uitgelicht ? "checked" : ""}><span class="grow">Uitgelicht op Home</span></label>
            <label class="check"><input type="checkbox" name="bevestigd" ${p.bevestigd ? "checked" : ""}><span class="grow">Prijs bevestigd door De Zon</span></label>
            <p class="field-error" data-err role="alert"></p>
            <div class="two"><button class="btn" data-save>Opslaan</button><button class="btn danger" data-del>Verwijderen</button></div>
          </div></details>`)}</section>`)}`;
  },
  mount(root, app) {
    const save = async (menu, msg, focus) => {
      try { await app.ds.saveMenu(menu); await app.refreshData(); app.toast(msg); app.rerender({ focus }); }
      catch (e) { app.toast(e.message, "error"); }
    };
    root.addEventListener("toggle", (e) => { const id = e.target.dataset?.id; if (id) (e.target.open ? open.add(id) : open.delete(id)); }, true);
    $("#new-form", root).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, naam = f.naam.value.trim(), prijs = parseEuroInput(f.prijs.value);
      if (!naam || prijs == null) { $("#n-err", root).textContent = "Vul een naam en een prijs in (bijvoorbeeld 3,50)."; return; }
      const menu = structuredClone(app.data.menu);
      let id = slug(naam); while (menu.producten.some((p) => p.id === id)) id += "-2";
      menu.producten.push({ id, categorie: f.categorie.value, naam, omschrijving: "", prijs, opties: [], uitverkocht: false, uitgelicht: false, bevestigd: false });
      open.add(id);
      await save(menu, "Product toegevoegd", `[data-id="${id}"] summary`);
    });
    root.addEventListener("click", async (e) => {
      const d = e.target.closest("details.adm[data-id]"), id = d?.dataset.id;
      if (!id) return;
      const menu = structuredClone(app.data.menu), i = menu.producten.findIndex((p) => p.id === id);
      if (e.target.closest("[data-save]")) {
        const g = (n) => d.querySelector(`[name="${n}"]`);
        const prijs = parseEuroInput(g("prijs").value), naam = g("naam").value.trim();
        if (!naam || prijs == null) { d.querySelector("[data-err]").textContent = "Vul een naam en een geldige prijs in (bijvoorbeeld 3,50)."; return; }
        Object.assign(menu.producten[i], { naam, omschrijving: g("omschrijving").value.trim(), prijs, uitverkocht: g("uitverkocht").checked, uitgelicht: g("uitgelicht").checked, bevestigd: g("bevestigd").checked });
        await save(menu, "Opgeslagen", `[data-id="${id}"] summary`);
      }
      if (e.target.closest("[data-del]")) {
        if (!(await confirmSheet(app, { title: `${menu.producten[i].naam} verwijderen?`, text: "Het product verdwijnt uit het menu (alleen op dit toestel).", yes: "Verwijderen" }))) return;
        menu.producten.splice(i, 1); open.delete(id);
        await save(menu, "Verwijderd", "h1");
      }
    });
  },
};
