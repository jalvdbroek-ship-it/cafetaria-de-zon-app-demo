import { html, $, $$, reducedMotion } from "../lib/dom.js";
import { formatEuro } from "../lib/money.mjs";
import { matchesQuery } from "../lib/search.mjs";
import { icon, illustration } from "../components/icons.js";
import { productRow, bindProducts, photo } from "../components/product.js";

function sections(app, query) {
  const { menu } = app.data;
  const out = menu.categorieen.map((c) => {
    const items = menu.producten.filter((p) => p.categorie === c.id && matchesQuery(p, query));
    if (!items.length) return "";
    return html`
      <section class="cat" id="cat-${c.id}" aria-labelledby="h-${c.id}">
        ${query ? "" : photo(app, c.foto, { cls: "banner" })}
        <div class="spread"><h2 id="h-${c.id}">${c.naam}</h2><span class="muted small">${items.length} ${items.length === 1 ? "product" : "producten"}</span></div>
        <ul class="plist">${items.map((p) => productRow(app, p))}</ul>
      </section>`;
  });
  if (out.every((s) => s === "")) {
    return html`<div class="state"><span class="ill-wrap">${illustration("saus")}</span><h2>Niets gevonden</h2><p class="muted">Geen product past bij "${query}". Probeer een ander woord.</p><button class="btn secondary sm" data-clear>Zoekopdracht wissen</button></div>`;
  }
  return html`${out}`;
}

export default {
  title: "Menu",
  render(app, cat) {
    const { menu } = app.data;
    return html`
      <h1>Menukaart</h1>
      <p class="small"><span class="pill voorbeeld">Voorbeeldkaart</span> Producten en prijzen zijn voorbeelden, geen echte kaart van De Zon.</p>
      <div class="menu-bar">
        <div class="field"><label class="sr" for="q">Zoek in het menu</label><input id="q" type="search" placeholder="Zoek bijvoorbeeld frikandel" autocomplete="off" enterkeyhint="search"></div>
        <div class="chips" id="chips" role="group" aria-label="Categorieën">${menu.categorieen.map((c) => html`<button class="chip" data-cat="${c.id}">${c.naam}</button>`)}</div>
      </div>
      <div id="list" class="stack-lg">${sections(app, "")}</div>
      <a class="cartbar" id="cartbar" href="#/mandje" hidden></a>`;
  },
  mount(root, app, cat) {
    const list = $("#list", root), q = $("#q", root), chips = $("#chips", root), bar = $("#cartbar", root);
    const un = bindProducts(root, app);
    let raf = 0;
    const setActive = (id) => $$(".chip", chips).forEach((c) => { if (c.dataset.cat === id) { if (c.getAttribute("aria-current") !== "true") { c.setAttribute("aria-current", "true"); chips.scrollTo({ left: c.offsetLeft - (chips.clientWidth - c.offsetWidth) / 2 }); } } else c.removeAttribute("aria-current"); });
    const track = () => {
      raf = 0;
      if (q.value.trim()) return;
      const secs = $$(".cat", list);
      const cur = secs.filter((s) => s.getBoundingClientRect().top <= 230).pop() || secs[0];
      if (cur) setActive(cur.id.replace("cat-", ""));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(track); };
    addEventListener("scroll", onScroll, { passive: true });
    const goto = (id, smooth) => {
      const el = $(`#cat-${id}`, list);
      if (el) el.scrollIntoView({ behavior: smooth && !reducedMotion() ? "smooth" : "auto", block: "start" });
    };
    const updateBar = () => {
      const { count, subtotal } = app.priced();
      bar.hidden = count === 0;
      bar.innerHTML = html`<span>${icon("bag")} ${count} ${count === 1 ? "product" : "producten"}</span><span class="num">${formatEuro(subtotal)} · Bekijk mandje</span>`.s;
    };
    const offCart = app.on("cart", updateBar);
    updateBar();
    q.addEventListener("input", () => { list.innerHTML = sections(app, q.value).s; chips.hidden = !!q.value.trim(); track(); });
    root.addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat]");
      if (c) goto(c.dataset.cat, true);
      if (e.target.closest("[data-clear]")) { q.value = ""; q.dispatchEvent(new Event("input")); q.focus(); }
    });
    track();
    if (cat) document.fonts.ready.then(() => { goto(cat, false); track(); });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); offCart(); un(); };
  },
};
