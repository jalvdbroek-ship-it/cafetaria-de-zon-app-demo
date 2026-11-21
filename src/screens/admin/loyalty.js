import { html, $, $$ } from "../../lib/dom.js";

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "beloning";

export default {
  render(app) {
    const l = app.data.config.loyalty;
    return html`
      <form id="loy" class="stack" novalidate>
        <p class="small muted">Alles hier is een voorbeeldregeling tot De Zon er zelf een kiest.</p>
        <div class="field"><label for="ppe">Punten per bestede euro</label><input id="ppe" name="ppe" type="number" min="0" max="10" step="1" inputmode="numeric" value="${l.pointsPerEuro}"></div>
        <label class="check"><input type="checkbox" name="voorbeeld" ${l.voorbeeld ? "checked" : ""}><span class="grow">Toon als voorbeeldregels</span></label>
        <h3>Beloningen</h3>
        <div id="rewards" class="stack">${l.rewards.map((r) => html`
          <div class="reward-edit" data-id="${r.id}"><input aria-label="Naam beloning" name="rnaam" type="text" maxlength="40" value="${r.naam}"><input aria-label="Aantal punten" name="rpunten" type="number" min="1" max="5000" inputmode="numeric" value="${r.punten}"><button type="button" class="icon-btn" data-rdel aria-label="Verwijder ${r.naam}">×</button></div>`)}</div>
        <button type="button" class="btn secondary sm" id="radd">Beloning toevoegen</button>
        <p class="field-error" id="l-err" role="alert"></p>
        <button class="btn" type="submit">Opslaan</button>
      </form>`;
  },
  mount(root, app) {
    const box = $("#rewards", root);
    $("#radd", root).addEventListener("click", () => {
      const d = document.createElement("div"); d.className = "reward-edit";
      d.innerHTML = '<input aria-label="Naam beloning" name="rnaam" type="text" maxlength="40" value=""><input aria-label="Aantal punten" name="rpunten" type="number" min="1" max="5000" inputmode="numeric" value="100"><button type="button" class="icon-btn" data-rdel aria-label="Verwijder beloning">×</button>';
      box.append(d); d.querySelector("input").focus();
    });
    box.addEventListener("click", (e) => e.target.closest("[data-rdel]")?.closest(".reward-edit").remove());
    $("#loy", root).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, ppe = Number(f.ppe.value), err = $("#l-err", root);
      const rewards = $$(".reward-edit", box).map((r) => ({ id: r.dataset.id, naam: r.querySelector('[name=rnaam]').value.trim(), punten: Number(r.querySelector('[name=rpunten]').value) }));
      if (!Number.isInteger(ppe) || ppe < 0 || ppe > 10) return void (err.textContent = "Punten per euro: een geheel getal van 0 tot 10.");
      if (rewards.some((r) => !r.naam || !Number.isInteger(r.punten) || r.punten < 1)) return void (err.textContent = "Elke beloning heeft een naam en een geheel aantal punten.");
      const used = new Set();
      for (const r of rewards) { r.id = r.id || slug(r.naam); while (used.has(r.id)) r.id += "-2"; used.add(r.id); }
      await app.ds.saveConfig({ loyalty: { voorbeeld: f.voorbeeld.checked, pointsPerEuro: ppe, rewards } });
      await app.refreshData(); app.toast("Spaarregels opgeslagen"); app.rerender({ focus: "h1" });
    });
  },
};
