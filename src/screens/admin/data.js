import { html, $ } from "../../lib/dom.js";
import { icon } from "../../components/icons.js";
import { confirmSheet } from "../../components/confirm.js";

export default {
  render() {
    return html`
      <p class="small muted">Menu, acties, spaarregels en tijden kun je als JSON bewaren en op een ander toestel terugzetten.</p>
      <button class="btn" id="exp">${icon("download")} Exporteer als JSON</button>
      <div class="field"><label for="imp">Importeer een JSON-bestand</label><input id="imp" type="file" accept="application/json,.json"><p class="field-error" id="d-err" role="alert"></p></div>
      <button class="btn danger" id="reset">Zet alles terug naar de standaard</button>`;
  },
  mount(root, app) {
    $("#exp", root).addEventListener("click", async () => {
      const url = URL.createObjectURL(new Blob([await app.ds.exportAdmin()], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `de-zon-beheer-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    $("#imp", root).addEventListener("change", async (e) => {
      const file = e.target.files[0], err = $("#d-err", root);
      err.textContent = "";
      if (!file) return;
      if (file.size > 1_000_000) return void (err.textContent = "Dit bestand is te groot.");
      try { await app.ds.importAdmin(await file.text()); await app.refreshData(); app.toast("Geimporteerd"); app.rerender({ focus: "h1" }); }
      catch (x) { err.textContent = x.message; }
    });
    $("#reset", root).addEventListener("click", async () => {
      if (!(await confirmSheet(app, { title: "Beheer terugzetten?", text: "Menu, acties, spaarregels en tijden gaan terug naar de standaard. Je bestellingen en punten blijven.", yes: "Terugzetten" }))) return;
      await app.ds.resetAdmin(); await app.refreshData(); app.toast("Teruggezet"); app.rerender({ focus: "h1" });
    });
  },
};
