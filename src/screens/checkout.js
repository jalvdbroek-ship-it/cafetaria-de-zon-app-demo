import { html, $, $$ } from "../lib/dom.js";
import { formatEuro } from "../lib/money.mjs";
import { buildSlots } from "../lib/slots.mjs";
import { validateCheckout } from "../lib/validate.mjs";
import { demoBanner } from "../components/order.js";
import { icon } from "../components/icons.js";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default {
  title: "Afrekenen",
  async render(app) {
    const priced = app.priced();
    if (!priced.lines.length || priced.unavailable.length) {
      return html`<h1>Afrekenen</h1><div class="state"><h2>${priced.unavailable.length ? "Pas je mandje aan" : "Je mandje is leeg"}</h2><a class="btn" href="#/mandje">Naar mandje</a></div>`;
    }
    const { config, site } = app.data;
    const acc = await app.ds.getAccount();
    const slots = buildSlots(app.now(), site.hours, config.pickup);
    app.checkoutSlots = slots;
    return html`
      <a class="link back" href="#/mandje">${icon("back")} Mandje</a>
      <h1>Afrekenen</h1>
      ${demoBanner("Je plaatst een demo-bestelling. Die wordt alleen op dit toestel bewaard en niet naar De Zon gestuurd. Betalen kan nog niet.")}
      <form id="co" class="stack-lg" novalidate>
        <div class="field"><label for="naam">Naam</label><input id="naam" name="naam" type="text" autocomplete="name" maxlength="60" value="${acc.naam}"><p class="field-error" id="e-naam" role="alert"></p></div>
        <div class="field"><label for="telefoon">Telefoonnummer</label><input id="telefoon" name="telefoon" type="tel" inputmode="tel" autocomplete="tel" value="${acc.telefoon}"><p class="hint">Zodat De Zon je kan bellen als er iets is.</p><p class="field-error" id="e-telefoon" role="alert"></p></div>
        <div class="field"><label for="email">E-mailadres <span class="muted">(optioneel)</span></label><input id="email" name="email" type="email" inputmode="email" autocomplete="email" value="${acc.email}"><p class="field-error" id="e-email" role="alert"></p></div>
        <fieldset class="field slotset" aria-describedby="e-pickup">
          <legend class="label">Afhaalmoment</legend>
          ${slots.slots.length ? html`
            ${!slots.asap && slots.offset !== null ? html`<p class="hint">De Zon is nu niet geopend voor afhalen. Kies een moment ${slots.dayLabel === "vandaag" ? "vandaag" : slots.dayLabel}.</p>` : ""}
            ${slots.asap ? html`<label class="check"><input type="radio" name="slot" value="asap" checked><span class="grow">Zo snel mogelijk <span class="muted small">(ongeveer ${config.pickup.leadMin} minuten)</span></span></label>` : ""}
            <p class="label small">${cap(slots.dayLabel)}</p>
            <div class="slots">${slots.slots.map((s, i) => html`<label class="slot"><input type="radio" name="slot" value="${s.at}" ${!slots.asap && i === 0 ? "checked" : ""}><span class="num">${s.label}</span></label>`)}</div>` : html`<p class="field-error">Er zijn geen afhaalmomenten beschikbaar. Bel De Zon.</p>`}
          <p class="field-error" id="e-pickup" role="alert"></p>
        </fieldset>
        <div class="field"><label for="opmerking">Opmerking <span class="muted">(optioneel)</span></label><textarea id="opmerking" name="opmerking" maxlength="140" rows="2"></textarea><p class="hint"><span id="cnt" class="num">0</span>/140</p><p class="field-error" id="e-opmerking" role="alert"></p></div>
        <label class="check"><input type="checkbox" name="bewaar" checked><span class="grow">Bewaar mijn gegevens op dit toestel voor de volgende keer</span></label>
        <section class="card soft stack" aria-label="Overzicht">
          <ul class="olines">${priced.lines.map((l) => html`<li><span class="num">${l.qty}×</span><span class="grow">${l.product.naam}${l.optionNames.length ? html`<span class="muted small block">${l.optionNames.join(", ")}</span>` : ""}</span><span class="num">${formatEuro(l.total)}</span></li>`)}
          <li class="total"><span class="grow">Totaal</span><span class="num">${formatEuro(priced.subtotal)}</span></li></ul>
          <p class="small muted">Betalen in de app kan nog niet (koppeling nodig). Voorbeeldprijzen.</p>
        </section>
        <p class="field-error" id="e-form" role="alert"></p>
        <button class="btn block big" type="submit" id="go" ${slots.slots.length ? "" : "disabled"}>Demo-bestelling opslaan · ${formatEuro(priced.subtotal)}</button>
      </form>`;
  },
  mount(root, app) {
    const form = $("#co", root);
    if (!form) return;
    const setErr = (name, msg) => {
      const n = $(`#e-${name}`, form), f = form.elements[name];
      if (n) n.textContent = msg || "";
      if (f && f.setAttribute) { if (msg) { f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", `e-${name}`); } else f.removeAttribute("aria-invalid"); }
    };
    $("#opmerking", form).addEventListener("input", (e) => { $("#cnt", form).textContent = e.target.value.length; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const errs = validateCheckout(d);
      for (const n of ["naam", "telefoon", "email", "opmerking"]) setErr(n, errs[n]);
      $("#e-pickup", form).textContent = d.slot ? "" : "Kies een afhaalmoment.";
      $("#e-form", form).textContent = "";
      const first = ["naam", "telefoon", "email", "opmerking"].find((n) => errs[n]);
      if (first || !d.slot) { (first ? form.elements[first] : $("[name=slot]", form))?.focus(); return; }
      const btn = $("#go", form);
      btn.disabled = true;
      const sl = app.checkoutSlots.slots.find((s) => s.at === d.slot);
      const pickup = d.slot === "asap" ? { asap: true } : { asap: false, at: d.slot, label: `${app.checkoutSlots.dayLabel} ${sl?.label || ""}`.trim() };
      try {
        const order = await app.ds.placeOrder({ lines: app.cart.lines, customer: d, pickup });
        if (d.bewaar) await app.ds.saveAccount({ naam: d.naam, telefoon: d.telefoon, email: d.email });
        app.dispatch({ type: "clear" });
        app.go(`#/mandje/klaar/${order.id}`);
      } catch (err) {
        btn.disabled = false;
        if (err.fields) { for (const [k, v] of Object.entries(err.fields)) setErr(k, v); }
        else $("#e-form", form).textContent = err.message;
      }
    });
  },
};
