import { html } from "../lib/dom.js";
import { formatEuro } from "../lib/money.mjs";
import { icon, illustration } from "../components/icons.js";
import { formatPickup, formatDate } from "../components/order.js";

export default {
  title: "Mijn bestellingen",
  async render(app) {
    const orders = await app.ds.listOrders();
    return html`
      <a class="link back" href="#/account">${icon("back")} Account</a>
      <h1>Mijn bestellingen</h1>
      ${orders.length ? html`
        <p class="small muted">Alleen demo-bestellingen op dit toestel. De Zon heeft ze niet ontvangen.</p>
        <ul class="stack">${orders.map((o) => html`
          <li class="card stack">
            <div class="spread"><strong class="num">${o.id}</strong><span class="pill demo">Demo</span></div>
            <p class="small muted">${formatDate(o.createdAt)} · afhalen: ${formatPickup(o)}</p>
            <p>${o.lines.map((l) => `${l.qty}× ${l.naam}`).join(", ")}</p>
            <div class="spread"><strong class="num">${formatEuro(o.total)}</strong>
              <button class="btn secondary sm" data-again="${o.id}">Opnieuw bestellen</button></div>
          </li>`)}</ul>`
      : html`<div class="state"><span class="ill-wrap">${illustration("snack")}</span><h2>Nog geen bestellingen</h2><p class="muted">Je demo-bestellingen verschijnen hier.</p><a class="btn" href="#/menu">Naar het menu</a></div>`}`;
  },
  mount(root, app) {
    const onClick = async (e) => {
      const b = e.target.closest("[data-again]");
      if (!b) return;
      const order = (await app.ds.listOrders()).find((o) => o.id === b.dataset.again);
      let added = 0, skipped = 0;
      for (const l of order.lines) {
        const ok = app.dispatch({ type: "add", productId: l.productId, selection: l.selection || {}, qty: l.qty });
        if (ok) added++; else skipped++;
      }
      app.toast(skipped ? `${added} toegevoegd, ${skipped} niet beschikbaar` : "Toegevoegd aan je mandje");
      if (added) app.go("#/mandje");
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  },
};
