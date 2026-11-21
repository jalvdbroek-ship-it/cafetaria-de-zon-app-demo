import { html } from "../../lib/dom.js";
import { formatEuro } from "../../lib/money.mjs";
import { formatPickup, formatDate } from "../../components/order.js";

export default {
  async render(app) {
    const orders = await app.ds.listOrders();
    return html`
      <p class="small muted">Hier staan alleen demo-bestellingen van dit toestel. Echte bestellingen van klanten komen pas met een koppeling (zie docs/BEHEER-UITBREIDING.md).</p>
      ${orders.length ? html`<ul class="stack">${orders.map((o) => html`
        <li class="card stack"><div class="spread"><strong class="num">${o.id}</strong><span class="pill demo">Demo</span></div>
          <p class="small muted">${formatDate(o.createdAt)} · afhalen: ${formatPickup(o)}</p>
          <p>${o.customer.naam} · <a href="tel:${o.customer.telefoon}">${o.customer.telefoon}</a></p>
          <p>${o.lines.map((l) => `${l.qty}× ${l.naam}${l.optionNames.length ? ` (${l.optionNames.join(", ")})` : ""}`).join(", ")}</p>
          ${o.customer.opmerking ? html`<p class="small">Opmerking: ${o.customer.opmerking}</p>` : ""}
          <strong class="num">${formatEuro(o.total)}</strong></li>`)}</ul>` : html`<p class="muted">Nog geen demo-bestellingen.</p>`}`;
  },
};
