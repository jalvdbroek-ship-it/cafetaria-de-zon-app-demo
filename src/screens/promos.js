import { html } from "../lib/dom.js";
import { activePromos } from "../lib/promos.mjs";
import { illustration } from "../components/icons.js";

export default {
  title: "Acties",
  render(app) {
    const list = activePromos(app.data.promos, app.now());
    return html`
      <h1>Acties</h1>
      ${list.length ? html`<ul class="stack">${list.map((p) => html`
        <li class="card sun stack">
          <div class="spread"><h2>${p.titel}</h2>${p.voorbeeld ? html`<span class="pill voorbeeld">Voorbeeld</span>` : ""}</div>
          <p>${p.tekst}</p>
          ${p.tot ? html`<p class="small">Tot en met ${p.tot}</p>` : ""}
          ${p.knop ? html`<a class="btn secondary sm" href="${p.knop.href}">${p.knop.label}</a>` : ""}
        </li>`)}</ul>`
      : html`<div class="state"><span class="ill-wrap">${illustration("ijs")}</span><h2>Nu geen acties</h2><p class="muted">Kom later terug, of bel De Zon voor de actuele aanbiedingen.</p></div>`}
      <p class="small muted">Acties staan in het demo-beheerpaneel en komen straks van De Zon zelf.</p>`;
  },
};
