import { html, $ } from "../../lib/dom.js";
import { weekRows } from "../../lib/hours.mjs";

export default {
  render(app) {
    const { site, config } = app.data;
    const p = config.pickup;
    return html`
      <section class="card soft stack"><h3>Bevestigde gegevens</h3>
        <p>${site.street}, ${site.postal} ${site.city}<br>${site.phoneDisplay} · ${site.email}<br>Betalen: ${site.payment.join(", ")}</p>
        <p class="small muted">Deze gegevens zijn bevestigd en staan in src/data/site.json.</p></section>
      <form id="info" class="stack" novalidate>
        <h3>Openingstijden</h3>
        ${weekRows(site.hours).map((r) => html`
          <div class="hours-edit" data-dow="${r.dow}"><span class="day">${r.dag}</span>
            <input aria-label="Open ${r.dag}" type="time" name="o" value="${r.open || "12:30"}" ${r.open ? "" : "disabled"}>
            <input aria-label="Sluit ${r.dag}" type="time" name="c" value="${r.close || "22:00"}" ${r.open ? "" : "disabled"}>
            <label class="check"><input type="checkbox" name="dicht" ${r.open ? "" : "checked"}><span>Dicht</span></label></div>`)}
        <h3>Afhalen</h3>
        <div class="two">
          <div class="field"><label for="iv">Slot (min)</label><input id="iv" name="iv" type="number" min="5" max="60" step="5" value="${p.intervalMin}"></div>
          <div class="field"><label for="ld">Voorbereiding (min)</label><input id="ld" name="ld" type="number" min="0" max="120" step="5" value="${p.leadMin}"></div>
        </div>
        <p class="field-error" id="i-err" role="alert"></p>
        <button class="btn" type="submit">Opslaan</button>
      </form>`;
  },
  mount(root, app) {
    const form = $("#info", root);
    form.addEventListener("change", (e) => {
      if (e.target.name !== "dicht") return;
      for (const i of e.target.closest(".hours-edit").querySelectorAll("input[type=time]")) i.disabled = e.target.checked;
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const hours = {};
      for (const row of form.querySelectorAll(".hours-edit")) {
        const closed = row.querySelector("[name=dicht]").checked;
        hours[row.dataset.dow] = closed ? null : [row.querySelector("[name=o]").value, row.querySelector("[name=c]").value];
        if (!closed && !(hours[row.dataset.dow][0] && hours[row.dataset.dow][1])) return void ($("#i-err", root).textContent = "Vul bij elke open dag een openings- en sluitingstijd in.");
      }
      const iv = Number(form.iv.value), ld = Number(form.ld.value);
      if (!Number.isInteger(iv) || iv < 5 || iv > 60 || !Number.isInteger(ld) || ld < 0 || ld > 120) return void ($("#i-err", root).textContent = "Slot 5 tot 60 minuten, voorbereiding 0 tot 120 minuten.");
      await app.ds.saveSite({ hours });
      await app.ds.saveConfig({ pickup: { ...app.data.config.pickup, intervalMin: iv, leadMin: ld } });
      await app.refreshData(); app.toast("Tijden opgeslagen"); app.rerender({ focus: "h1" });
    });
  },
};
