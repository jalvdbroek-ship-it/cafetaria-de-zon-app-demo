import { html, esc, $, $$ } from "../lib/dom.js";
import { icon } from "./icons.js";

const TABS = [
  ["home", "Home", "#/home", "home"],
  ["menu", "Menu", "#/menu", "menu"],
  ["mandje", "Mandje", "#/mandje", "bag"],
  ["sparen", "Sparen", "#/sparen", "card"],
  ["account", "Account", "#/account", "user"],
];

export function mountShell(app) {
  const bar = $("#tabbar");
  bar.innerHTML = TABS.map(([id, label, href, ic]) => html`
    <a href="${href}" data-tab="${id}"><span class="tab-ic">${icon(ic)}${id === "mandje" ? html`<span class="badge" hidden></span>` : ""}</span><span class="tab-label">${label}</span></a>`.s).join("");
  $("#top-call .ic").outerHTML = icon("phone").s;
  const phone = app.data.site.phone;
  if (phone) $("#top-call").href = `tel:${phone}`;

  const updateBadge = (bump) => {
    const n = app.priced().count;
    const badge = $(".badge", bar), link = $('[data-tab="mandje"]', bar);
    badge.hidden = n === 0;
    badge.textContent = n > 99 ? "99+" : String(n);
    link.setAttribute("aria-label", n ? `Mandje, ${n} ${n === 1 ? "product" : "producten"}` : "Mandje, leeg");
    if (bump && n) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
  };
  updateBadge(false);
  app.on("cart", () => updateBadge(true));
  app.on("data", () => updateBadge(false));

  return (tab) => $$("a", bar).forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}

export function mountOverlays(app) {
  const toast = $("#toast"), sheet = $("#sheet");
  let timer;
  app.toast = (msg, kind = "info") => {
    clearTimeout(timer);
    toast.className = `toast show ${kind}`;
    toast.textContent = msg;
    timer = setTimeout(() => toast.classList.remove("show"), kind === "error" ? 5000 : 2600);
  };

  let cleanup = null;
  app.openSheet = (content, { label = "Details", onMount } = {}) => {
    sheet.setAttribute("aria-label", label);
    sheet.innerHTML = `<div class="sheet-body">${content.s}</div>`;
    if (!sheet.open) sheet.showModal();
    cleanup = onMount?.(sheet) || null;
  };
  app.closeSheet = () => { if (sheet.open) sheet.close(); };
  sheet.addEventListener("close", () => { cleanup?.(); cleanup = null; sheet.innerHTML = ""; });
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) app.closeSheet();
  });
  addEventListener("offline", () => app.toast("Je bent offline. Bladeren blijft werken."));
  addEventListener("online", () => app.toast("Je bent weer online."));
}

export const fatal = (root, msg) => {
  root.innerHTML = `<div class="fatal"><h1>De app kon niet starten</h1><p>${esc(msg)}</p><p>Bel De Zon op <a href="tel:+31181663669">0181 66 36 69</a> om af te halen.</p><button class="btn" id="retry">Opnieuw proberen</button></div>`;
  root.hidden = false;
  document.getElementById("boot")?.remove();
  document.getElementById("retry")?.addEventListener("click", () => location.reload());
};
