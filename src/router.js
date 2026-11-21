import { html, $, reducedMotion } from "./lib/dom.js";

const ROUTES = [
  [/^\/home$/, "home", () => import("./screens/home.js")],
  [/^\/menu(?:\/([a-z0-9-]+))?$/, "menu", () => import("./screens/menu.js")],
  [/^\/mandje$/, "mandje", () => import("./screens/cart.js")],
  [/^\/mandje\/afrekenen$/, "mandje", () => import("./screens/checkout.js")],
  [/^\/mandje\/klaar\/(DEMO-[A-Z0-9]{4})$/, "mandje", () => import("./screens/done.js")],
  [/^\/sparen$/, "sparen", () => import("./screens/loyalty.js")],
  [/^\/acties$/, "sparen", () => import("./screens/promos.js")],
  [/^\/account$/, "account", () => import("./screens/account.js")],
  [/^\/account\/bestellingen$/, "account", () => import("./screens/orders.js")],
  [/^\/contact$/, "account", () => import("./screens/contact.js")],
  [/^\/privacy$/, "account", () => import("./screens/privacy.js")],
  [/^\/beheer(?:\/([a-z]+))?$/, "account", () => import("./screens/admin.js")],
];

export function startRouter(app, setTab) {
  const view = $("#view");
  let cleanup = null, current = null, first = true, token = 0, vt = null;

  async function show({ keepScroll = false, focus = null } = {}) {
    const mine = ++token;
    const path = location.hash.replace(/^#/, "") || "/home";
    const hit = ROUTES.map(([re, tab, load]) => [re.exec(path), tab, load]).find(([m]) => m);
    if (!hit) { location.replace("#/home"); return; }
    const [m, tab, load] = hit;
    let screen;
    try { screen = (await load()).default; } catch {
      view.innerHTML = html`<section class="state"><h1 tabindex="-1">Dit scherm kon niet laden</h1><p>Misschien ben je offline. Probeer het opnieuw.</p><a class="btn" href="#/home">Naar home</a></section>`.s;
      return;
    }
    if (mine !== token) return;
    const params = m.slice(1);
    const paint = async () => {
      const out = await screen.render(app, ...params);
      if (mine !== token) return;
      cleanup?.();
      view.innerHTML = out.s;
      view.dataset.route = path;
      cleanup = screen.mount?.(view, app, ...params) || null;
      setTab(tab);
      document.title = `${screen.title} · De Zon (demo)`;
      if (!keepScroll) scrollTo(0, screen.keepScroll ? scrollY : 0);
      if (focus) view.querySelector(focus)?.focus({ preventScroll: true });
      else if (!first && !keepScroll) { const h = view.querySelector("h1"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
    };
    const animate = document.startViewTransition && !vt && !reducedMotion() && !first && !keepScroll && current !== path;
    current = path;
    first = false;
    if (animate) {
      vt = document.startViewTransition(paint);
      vt.finished.catch(() => {}).finally(() => { vt = null; });
      await vt.updateCallbackDone.catch(() => {});
    }
    else await paint();
  }

  app.rerender = (opts = {}) => show({ keepScroll: true, ...opts });
  addEventListener("hashchange", () => show());
  return show();
}
