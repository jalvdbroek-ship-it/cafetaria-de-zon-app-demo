import { html, $ } from "../lib/dom.js";
import { confirmSheet } from "../components/confirm.js";
import { formatEuro } from "../lib/money.mjs";
import { icon, illustration } from "../components/icons.js";
import { demoBanner } from "../components/order.js";

export default {
  title: "Mandje",
  render(app) {
    const priced = app.priced();
    if (!priced.lines.length) {
      return html`<h1>Mandje</h1>
        <div class="state"><span class="ill-wrap">${illustration("frites")}</span><h2>Je mandje is leeg</h2><p class="muted">Kies iets lekkers van de menukaart.</p><a class="btn" href="#/menu">Naar het menu</a></div>`;
    }
    const blocked = priced.unavailable.length > 0;
    return html`
      <h1>Mandje</h1>
      ${demoBanner("Bestellen in deze app is een demo. Er wordt niets doorgestuurd of betaald.")}
      <ul class="clines">${priced.lines.map((l) => html`
        <li class="cline ${l.unavailable ? "is-out" : ""}">
          <div class="cline-top">
            <div class="grow">
              <p class="cline-name">${l.product?.naam || "Onbekend product"}</p>
              ${l.optionNames.length ? html`<p class="small muted">${l.optionNames.join(", ")}</p>` : ""}
              ${l.unavailable ? html`<p><span class="pill uit">Niet beschikbaar</span></p>` : ""}
            </div>
            <p class="num cline-total">${l.unavailable ? "" : formatEuro(l.total)}</p>
          </div>
          <div class="cline-ctl">
            ${l.unavailable ? html`<span></span>` : html`<div class="stepper" role="group" aria-label="Aantal ${l.product.naam}">
              <button class="icon-btn" data-act="dec" data-key="${l.key}" aria-label="Minder ${l.product.naam}">${icon("minus")}</button>
              <output class="num">${l.qty}</output>
              <button class="icon-btn" data-act="inc" data-key="${l.key}" aria-label="Meer ${l.product.naam}">${icon("plus")}</button>
            </div>`}
            <button class="link" data-act="remove" data-key="${l.key}" aria-label="Verwijder ${l.product?.naam || "product"}">${icon("trash")} Verwijder</button>
          </div>
        </li>`)}
      </ul>
      <section class="card sun stack" aria-label="Totaal">
        <div class="spread"><span>${priced.count} ${priced.count === 1 ? "product" : "producten"}</span><strong class="big-num num">${formatEuro(priced.subtotal)}</strong></div>
        <p class="small">Voorbeeldprijzen. Geen bezorgkosten: je haalt af.</p>
      </section>
      ${blocked ? html`<p class="field-error" role="alert">Verwijder de producten die niet beschikbaar zijn om verder te gaan.</p>` : ""}
      <div class="stack">
        <a class="btn block big" href="#/mandje/afrekenen" ${blocked ? 'aria-disabled="true" data-blocked' : ""}>Verder naar afrekenen</a>
        <button class="link" data-act="clear">Mandje leegmaken</button>
      </div>`;
  },
  mount(root, app) {
    const onClick = async (e) => {
      const blocked = e.target.closest("[data-blocked]");
      if (blocked) { e.preventDefault(); return app.toast("Verwijder eerst de producten die niet beschikbaar zijn.", "error"); }
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const key = b.dataset.key;
      if (b.dataset.act === "clear") { if (!(await confirmSheet(app, { title: "Mandje leegmaken?", text: "Alle producten gaan uit je mandje.", yes: "Leegmaken" }))) return; app.dispatch({ type: "clear" }); return app.rerender({ focus: "h1" }); }
      app.dispatch({ type: b.dataset.act, key });
      const still = app.cart.lines.some((l) => l.key === key);
      app.rerender({ focus: still ? `[data-act="${b.dataset.act}"][data-key="${CSS.escape(key)}"]` : "h1" });
      if (!still) { const h = $("h1", root); if (h) { h.tabIndex = -1; h.focus(); } }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  },
};
