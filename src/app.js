import { LocalDemoSource } from "./lib/datasource.mjs";
import { createApp } from "./state/app-state.js";
import { mountShell, mountOverlays, fatal } from "./components/shell.js";
import { startRouter } from "./router.js";

const root = document.getElementById("app");
const getJson = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
};

function pickStorage() {
  try {
    localStorage.setItem("dezon.v1.test", "1");
    localStorage.removeItem("dezon.v1.test");
    return { storage: localStorage, persistent: true };
  } catch {
    const m = new Map();
    return { persistent: false, storage: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) } };
  }
}

async function boot() {
  try {
    const [menu, promos, config, site, fotos] = await Promise.all([
      getJson("src/data/menu.json"), getJson("config/promos.json"), getJson("config/app.json"), getJson("src/data/site.json"), getJson("src/data/fotos.json"),
    ]);
    const { storage, persistent } = pickStorage();
    const ds = new LocalDemoSource({ menu, promos, config, site, storage });
    const app = await createApp({ ds });
    app.fotos = fotos;
    document.documentElement.classList.toggle("rm", (await ds.getSettings()).reduceMotion);
    app.persistent = persistent;
    root.hidden = false;
    document.getElementById("boot")?.remove();
    mountOverlays(app);
    const setTab = mountShell(app);
    if (!persistent) app.toast("Opslaan op dit toestel is uit: je mandje blijft niet bewaard.", "error");
    await startRouter(app, setTab);
    document.querySelector(".skip").addEventListener("click", (e) => { e.preventDefault(); document.getElementById("view").focus(); });
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    window.__app = app;
  } catch (e) {
    console.error(e);
    fatal(root, "Er ging iets mis bij het laden. Controleer je verbinding en probeer het opnieuw.");
  }
}
boot();
