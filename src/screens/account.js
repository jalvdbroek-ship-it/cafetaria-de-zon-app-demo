import { html, $ } from "../lib/dom.js";
import { icon } from "../components/icons.js";
import { productRow, bindProducts } from "../components/product.js";
import { confirmSheet } from "../components/confirm.js";

const nav = (href, ic, label, sub) => html`<li><a class="navrow" href="${href}">${icon(ic)}<span class="grow"><strong>${label}</strong>${sub ? html`<span class="small muted block">${sub}</span>` : ""}</span>${icon("chevron")}</a></li>`;

export default {
  title: "Account",
  async render(app) {
    const acc = await app.ds.getAccount();
    const orders = await app.ds.listOrders();
    const favIds = await app.ds.getFavorites();
    const favs = favIds.map((id) => app.data.idx.products.get(id)).filter(Boolean);
    const settings = await app.ds.getSettings();
    return html`
      <h1>Account</h1>
      <ul class="navlist">
        ${nav("#/account/bestellingen", "receipt", "Mijn bestellingen", `${orders.length} demo-${orders.length === 1 ? "bestelling" : "bestellingen"}`)}
        ${nav("#/acties", "tag", "Acties", "Voorbeeldacties")}
        ${nav("#/contact", "pin", "Contact en route", "Adres, openingstijden, bellen")}
        ${nav("#/privacy", "lock", "Privacy", "Wat er op je toestel staat")}
      </ul>
      <form id="prof" class="stack" novalidate aria-labelledby="prof-kop">
        <div class="spread"><h2 id="prof-kop">Mijn gegevens</h2><span class="pill demo">Op dit toestel</span></div>
        <div class="field"><label for="a-naam">Naam</label><input id="a-naam" name="naam" type="text" autocomplete="name" maxlength="60" value="${acc.naam}"><p class="field-error" id="e-naam" role="alert"></p></div>
        <div class="field"><label for="a-tel">Telefoonnummer</label><input id="a-tel" name="telefoon" type="tel" inputmode="tel" autocomplete="tel" value="${acc.telefoon}"><p class="field-error" id="e-telefoon" role="alert"></p></div>
        <div class="field"><label for="a-mail">E-mailadres</label><input id="a-mail" name="email" type="email" inputmode="email" autocomplete="email" value="${acc.email}"><p class="field-error" id="e-email" role="alert"></p></div>
        <button class="btn" type="submit">Bewaar gegevens</button>
      </form>
      <section class="stack" aria-labelledby="fav"><h2 id="fav">Favorieten</h2>
        ${favs.length ? html`<ul class="plist">${favs.map((p) => productRow(app, p))}</ul>` : html`<p class="muted">Tik op het hartje bij een product om het hier te bewaren.</p>`}</section>
      <section class="nodig-card" aria-labelledby="inlog">
        <h3 id="inlog">Inloggen <span class="pill nodig">Koppeling nodig</span></h3>
        <p>Een echt account met e-mail en wachtwoord kan pas met een server. Tot die er is, staan je gegevens alleen op dit toestel.</p>
        <button class="btn" disabled aria-disabled="true">Inloggen (nog niet beschikbaar)</button>
      </section>
      <section class="stack" aria-labelledby="inst"><h2 id="inst">Instellingen</h2>
        <p class="small muted">Taal: Nederlands</p>
        <label class="check"><input type="checkbox" id="rm" ${settings.reduceMotion ? "checked" : ""}><span class="grow">Beweging beperken <span class="small muted block">Zet animaties uit. Dit volgt ook de instelling van je toestel.</span></span></label>
        <button class="btn danger" id="wipe">Wis mijn gegevens op dit toestel</button>
      </section>
      <p class="small muted">De Zon-app, demo-versie 0.1</p>
      <a class="btn secondary sm" href="#/beheer">Beheer (demo)</a>`;
  },
  mount(root, app) {
    const form = $("#prof", root);
    const un = bindProducts(root, app);
    const setErr = (n, m) => { $(`#e-${n}`, form).textContent = m || ""; const f = form.elements[n]; if (m) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid"); };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      for (const n of ["naam", "telefoon", "email"]) setErr(n, "");
      try {
        await app.ds.saveAccount(Object.fromEntries(new FormData(form)));
        app.toast("Gegevens bewaard");
      } catch (err) {
        if (!err.fields) return app.toast(err.message, "error");
        for (const [k, v] of Object.entries(err.fields)) setErr(k, v);
        form.elements[Object.keys(err.fields)[0]]?.focus();
      }
    });
    $("#rm", root).addEventListener("change", async (e) => {
      await app.ds.saveSettings({ reduceMotion: e.target.checked });
      document.documentElement.classList.toggle("rm", e.target.checked);
    });
    const wipe = async () => {
      if (!(await confirmSheet(app, { title: "Alles wissen?", text: "Je gegevens, bestellingen, punten, favorieten en mandje worden van dit toestel gewist. Dit kan niet ongedaan worden.", yes: "Alles wissen" }))) return;
      await app.ds.clearAll();
      app.cart = app.ds.loadCart();
      app.emit("cart");
      document.documentElement.classList.remove("rm");
      app.toast("Je gegevens zijn gewist");
      app.rerender({ focus: "h1" });
    };
    $("#wipe", root).addEventListener("click", wipe);
    return un;
  },
};
