import { html, $ } from "../../lib/dom.js";
import { confirmSheet } from "../../components/confirm.js";

export default {
  render(app) {
    const list = app.data.promos;
    return html`
      <p class="small muted">Acties verschijnen op Home en onder Acties. Met een einddatum verdwijnen ze vanzelf.</p>
      <button class="btn secondary" id="add">Nieuwe actie</button>
      ${list.length ? "" : html`<p class="muted">Er zijn nog geen acties.</p>`}
      ${list.map((p, i) => html`
        <details class="adm" data-i="${i}" ${p.nieuw ? "open" : ""}>
          <summary><span class="grow">${p.titel}</span>${p.actief === false ? html`<span class="pill voorbeeld">Uit</span>` : ""}</summary>
          <div class="stack">
            <div class="field"><label>Titel<input name="titel" type="text" maxlength="60" value="${p.titel}"></label></div>
            <div class="field"><label>Tekst<textarea name="tekst" rows="3" maxlength="200">${p.tekst}</textarea></label></div>
            <div class="field"><label>Tot en met (optioneel)<input name="tot" type="date" value="${p.tot || ""}"></label></div>
            <label class="check"><input type="checkbox" name="actief" ${p.actief !== false ? "checked" : ""}><span class="grow">Actief</span></label>
            <label class="check"><input type="checkbox" name="voorbeeld" ${p.voorbeeld ? "checked" : ""}><span class="grow">Toon als voorbeeld</span></label>
            <p class="field-error" data-err role="alert"></p>
            <div class="two"><button class="btn" data-save>Opslaan</button><button class="btn danger" data-del>Verwijderen</button></div>
          </div></details>`)}`;
  },
  mount(root, app) {
    const save = async (promos, msg) => { try { await app.ds.savePromos(promos); await app.refreshData(); app.toast(msg); app.rerender({ focus: "h1" }); } catch (e) { app.toast(e.message, "error"); } };
    $("#add", root).addEventListener("click", () => save([{ id: `actie-${Date.now()}`, titel: "Nieuwe actie", tekst: "Beschrijf hier de actie.", actief: false, voorbeeld: true, nieuw: true }, ...app.data.promos], "Actie toegevoegd (staat nog uit)"));
    root.addEventListener("click", async (e) => {
      const d = e.target.closest("details.adm"); if (!d) return;
      const promos = structuredClone(app.data.promos), i = Number(d.dataset.i);
      if (e.target.closest("[data-save]")) {
        const g = (n) => d.querySelector(`[name="${n}"]`), titel = g("titel").value.trim();
        if (!titel) { d.querySelector("[data-err]").textContent = "Vul een titel in."; return; }
        delete promos[i].nieuw;
        Object.assign(promos[i], { titel, tekst: g("tekst").value.trim(), tot: g("tot").value || undefined, actief: g("actief").checked, voorbeeld: g("voorbeeld").checked });
        await save(promos, "Opgeslagen");
      }
      if (e.target.closest("[data-del]")) {
        if (!(await confirmSheet(app, { title: "Actie verwijderen?", text: promos[i].titel, yes: "Verwijderen" }))) return;
        promos.splice(i, 1); await save(promos, "Verwijderd");
      }
    });
  },
};
