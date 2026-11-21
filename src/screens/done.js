import { html } from "../lib/dom.js";
import { icon } from "../components/icons.js";
import { demoBanner, orderLines, formatPickup } from "../components/order.js";

export default {
  title: "Demo-bestelling",
  async render(app, id) {
    const order = (await app.ds.listOrders()).find((o) => o.id === id);
    const { site } = app.data;
    if (!order) return html`<h1>Bestelling niet gevonden</h1><div class="state"><p class="muted">Deze demo-bestelling staat niet meer op dit toestel.</p><a class="btn" href="#/menu">Naar het menu</a></div>`;
    return html`
      ${demoBanner("Dit is een demo. De Zon heeft deze bestelling niet ontvangen en er is niets betaald.")}
      <section class="card sun stack center">
        <p class="eyebrow">Demo-bestelnummer</p>
        <h1 class="order-id num">${order.id}</h1>
        <p>Afhalen: <strong>${formatPickup(order)}</strong></p>
        <p class="small">op ${site.street}, ${site.city}</p>
      </section>
      <section class="stack"><h2>Je bestelling</h2>${orderLines(order)}
        ${order.pointsEarned ? html`<p class="small"><span class="pill demo">Demo</span> Je kreeg ${order.pointsEarned} ${order.pointsEarned === 1 ? "punt" : "punten"} op je demo-spaarkaart.</p>` : ""}
      </section>
      <section class="nodig-card"><h3>Echt bestellen <span class="pill nodig">Koppeling nodig</span></h3>
        <p>Wil je echt iets halen? Bel De Zon, dan hoor je of het kan en hoe laat.</p>
        <a class="btn" href="tel:${site.phone}">${icon("phone")} Bel ${site.phoneDisplay}</a></section>
      <div class="two"><a class="btn secondary" href="#/menu">Naar het menu</a><a class="btn secondary" href="#/account/bestellingen">Mijn bestellingen</a></div>`;
  },
};
