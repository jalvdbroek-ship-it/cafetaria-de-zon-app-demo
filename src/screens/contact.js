import { html } from "../lib/dom.js";
import { icon } from "../components/icons.js";
import { weekRows, amsterdamParts } from "../lib/hours.mjs";

export default {
  title: "Contact",
  render(app) {
    const { site } = app.data;
    const today = amsterdamParts(app.now()).dow;
    return html`
      <h1>Contact en route</h1>
      <address class="card sun stack">
        <strong>Cafetaria De Zon</strong>
        <span>${site.street}<br>${site.postal} ${site.city}</span>
      </address>
      <div class="stack">
        <a class="btn block" href="${site.routeUrl}" target="_blank" rel="noopener">${icon("pin")} Route in Google Maps</a>
        <div class="two">
          <a class="btn secondary" href="tel:${site.phone}">${icon("phone")} Bel</a>
          <a class="btn secondary" href="mailto:${site.email}">${icon("mail")} Mail</a>
        </div>
        <p class="small muted">${site.phoneDisplay} · ${site.email}. Route opent Google Maps buiten de app.</p>
      </div>
      <section class="stack" aria-labelledby="tijden">
        <h2 id="tijden">Openingstijden</h2>
        <table class="hours">
          <caption class="sr">Openingstijden per dag</caption>
          <tbody>${weekRows(site.hours).map((r) => html`
            <tr ${r.dow === today ? 'aria-current="date"' : ""}><th scope="row">${r.dag}${r.dow === today ? html` <span class="pill voorbeeld">Vandaag</span>` : ""}</th><td class="num">${r.open ? `${r.open} tot ${r.close}` : "Gesloten"}</td></tr>`)}
          </tbody>
        </table>
      </section>
      <section class="stack" aria-labelledby="betalen">
        <h2 id="betalen">Betalen</h2>
        <p>${site.payment.join(" en ")}. Betalen in de app kan nog niet.</p>
      </section>
      <section class="stack">
        <a class="link" href="#/privacy">Privacy</a>
      </section>`;
  },
};
