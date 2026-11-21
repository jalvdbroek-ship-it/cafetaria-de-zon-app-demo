import { html } from "../lib/dom.js";

// Bevestiging in een sheet (geen window.confirm): geeft een Promise<boolean> terug.
export function confirmSheet(app, { title, text, yes = "Ja, doorgaan", no = "Annuleren", danger = true }) {
  return new Promise((resolve) => {
    let answer = false;
    app.openSheet(html`
      <h2>${title}</h2><p>${text}</p>
      <div class="two"><button class="btn secondary" data-close>${no}</button><button class="btn ${danger ? "danger" : ""}" data-yes>${yes}</button></div>`,
      { label: title, onMount(sheet) {
        const on = (e) => { if (e.target.closest("[data-yes]")) { answer = true; app.closeSheet(); } };
        sheet.addEventListener("click", on);
        const done = () => resolve(answer);
        sheet.addEventListener("close", done, { once: true });
        return () => sheet.removeEventListener("click", on);
      } });
  });
}
