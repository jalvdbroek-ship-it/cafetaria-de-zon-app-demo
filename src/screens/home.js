import { html } from "../lib/dom.js";
import { icon } from "../components/icons.js";
import { sundial, animateSun } from "../components/sundial.js";
import { productRow, bindProducts, photo } from "../components/product.js";
import { amsterdamParts } from "../lib/hours.mjs";
import { progress } from "../lib/loyalty.mjs";
import { activePromos } from "../lib/promos.mjs";
import { reducedMotion } from "../lib/dom.js";

const greeting = (h) => (h < 5 ? "Goedenacht" : h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond");

export default {
  title: "Home",
  async render(app) {
    const { menu, site, promos, config } = app.data;
    const now = app.now();
    const account = await app.ds.getAccount();
    const loy = await app.ds.getLoyalty();
    const name = account.naam.trim().split(/\s+/)[0];
    const featured = menu.producten.filter((p) => p.uitgelicht).slice(0, 6);
    const promo = activePromos(promos, now)[0];
    const prog = progress(loy.balance, config.loyalty.rewards);
    return html`
      <section class="hello">
        <p class="eyebrow">${site.city}</p>
        <h1>${greeting(Math.floor(amsterdamParts(now).minutes / 60))}${name ? `, ${name}` : ""}</h1>
      </section>
      <div id="dial">${sundial(now, site.hours)}</div>
      <section class="stack">
        <a class="btn block big" href="#/menu">Bekijk menukaart</a>
        <div class="two">
          <a class="btn secondary" href="tel:${site.phone}">${icon("phone")} Bel De Zon</a>
          <a class="btn secondary" href="${site.routeUrl}" target="_blank" rel="noopener">${icon("pin")} Route</a>
        </div>
      </section>
      <section class="nodig-card" aria-labelledby="echt">
        <h2 id="echt">Echt bestellen <span class="pill nodig">Koppeling nodig</span></h2>
        <p>Bestellen in deze app is een demo en bereikt De Zon niet. Voor een echte bestelling bel je ${site.phoneDisplay} of loop je langs op ${site.street}.</p>
      </section>
      <section class="stack" aria-labelledby="uitgelicht">
        <div class="spread"><h2 id="uitgelicht">Uitgelicht</h2><span class="pill voorbeeld">Voorbeeldkaart</span></div>
        <ul class="plist">${featured.map((p) => productRow(app, p))}</ul>
        <a class="link" href="#/menu">Hele menukaart</a>
      </section>
      ${promo ? html`
      <section class="card sun stack" aria-labelledby="actie">
        <div class="spread"><h2 id="actie">${promo.titel}</h2>${promo.voorbeeld ? html`<span class="pill voorbeeld">Voorbeeld</span>` : ""}</div>
        <p>${promo.tekst}</p>
        <a class="btn secondary sm" href="${promo.knop?.href || "#/acties"}">${promo.knop?.label || "Meer acties"}</a>
      </section>` : ""}
      <section class="card stack" aria-labelledby="sparen-kop">
        <div class="spread"><h2 id="sparen-kop">Sparen</h2><span class="pill demo">Demo</span></div>
        <p>Je hebt <strong class="num">${loy.balance}</strong> ${loy.balance === 1 ? "punt" : "punten"}.${prog.next ? ` Nog ${prog.remaining} voor "${prog.next.naam}".` : " Je kunt alle beloningen inwisselen."}</p>
        <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prog.fraction * 100)}" aria-label="Voortgang naar volgende beloning"><span style="width:${Math.round(prog.fraction * 100)}%"></span></div>
        <a class="btn secondary sm" href="#/sparen">Naar mijn spaarkaart</a>
      </section>
      ${photo(app, "afhalen")}`;
  },
  mount(root, app) {
    const { site } = app.data;
    animateSun(root, app.now(), site.hours, reducedMotion());
    const t = setInterval(() => { root.querySelector("#dial").innerHTML = sundial(app.now(), site.hours, { intro: false }).s; }, 30000);
    const un = bindProducts(root, app);
    return () => { clearInterval(t); un(); };
  },
};
