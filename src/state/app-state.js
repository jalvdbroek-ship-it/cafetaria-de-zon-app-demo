import { indexMenu, cartReducer, priceCart, emptyCart } from "../lib/cart.mjs";

// Eén gedeeld object voor schermen: data, mandje, meldingen en gebeurtenissen.
export async function createApp({ ds }) {
  const listeners = new Map();
  const app = {
    ds, data: {}, cart: emptyCart(),
    on(evt, fn) { (listeners.get(evt) || listeners.set(evt, new Set()).get(evt)).add(fn); return () => listeners.get(evt)?.delete(fn); },
    emit(evt, detail) { listeners.get(evt)?.forEach((fn) => fn(detail)); },
    now: () => new Date(),
    async refreshData() {
      const [menu, promos, config, site] = await Promise.all([ds.getMenu(), ds.getPromos(), ds.getConfig(), ds.getSite()]);
      app.data = { menu, idx: indexMenu(menu), promos, config, site };
      app.emit("data");
    },
    priced() { return priceCart(app.cart, app.data.idx); },
    dispatch(action) {
      try {
        app.cart = cartReducer(app.cart, action, app.data.idx);
      } catch (e) {
        app.toast(e.message, "error");
        return false;
      }
      ds.saveCart(app.cart);
      app.emit("cart", action);
      return true;
    },
    toast: () => {}, openSheet: () => {}, closeSheet: () => {}, go: (hash) => { location.hash = hash; }, rerender: () => {},
  };
  await app.refreshData();
  app.cart = ds.loadCart();
  // Een bewaard mandje kan producten bevatten die inmiddels weg zijn: die blijven zichtbaar als "niet beschikbaar".
  return app;
}
