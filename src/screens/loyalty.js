import { html, $ } from "../lib/dom.js";
import { progress } from "../lib/loyalty.mjs";
import { icon } from "../components/icons.js";
import { demoCode } from "../components/demo-code.js";
import { confirmSheet } from "../components/confirm.js";
import { formatDate } from "../components/order.js";

export default {
  title: "Sparen",
  async render(app) {
    const { config } = app.data;
    const loy = await app.ds.getLoyalty();
    const acc = await app.ds.getAccount();
    const cardId = await app.ds.getCardId();
    const rewards = [...config.loyalty.rewards].sort((a, b) => a.punten - b.punten);
    const prog = progress(loy.balance, rewards);
    const pct = Math.round(prog.fraction * 100);
    return html`
      <div class="spread"><h1>Sparen</h1><span class="pill demo">Demo</span></div>
      <p class="small muted">${config.loyalty.voorbeeld ? "Voorbeeldregels, niet van De Zon: " : ""}${config.loyalty.pointsPerEuro} ${config.loyalty.pointsPerEuro === 1 ? "punt" : "punten"} per bestede euro bij een demo-bestelling. Punten staan alleen op dit toestel.</p>
      <section class="stack" aria-labelledby="kaart-kop">
        <h2 class="sr" id="kaart-kop">Digitale klantenkaart</h2>
        <div class="flip" id="flip">
          <div class="face front">
            <div class="spread"><span class="brand-s">${icon("card")} De Zon</span><span class="pill demo">Demo</span></div>
            <div><p class="small">Spaarkaart van</p><p class="card-name">${acc.naam || "Gast"}</p></div>
            <div class="spread"><p class="card-pts num">${loy.balance}<span class="small"> ${loy.balance === 1 ? "punt" : "punten"}</span></p><p class="small num">${cardId}</p></div>
          </div>
          <div class="face back" inert aria-hidden="true">
            ${demoCode(cardId)}
            <p class="small center">Demo-code, geen echte QR-code en niet geldig bij De Zon.</p>
            <p class="small num">${cardId}</p>
          </div>
        </div>
        <button class="btn secondary sm" id="flip-btn" aria-pressed="false">${icon("flip")} Draai kaart om</button>
      </section>
      <section class="card stack" aria-labelledby="vg">
        <h2 id="vg">${prog.next ? `Nog ${prog.remaining} voor ${prog.next.naam.toLowerCase()}` : "Alles te verzilveren"}</h2>
        <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-labelledby="vg"><span style="width:${pct}%"></span></div>
      </section>
      <section class="stack" aria-labelledby="bel"><h2 id="bel">Beloningen</h2>
        <ul class="stack">${rewards.map((r) => { const ok = loy.balance >= r.punten; return html`
          <li class="reward ${ok ? "" : "locked"}"><div class="grow"><p class="cline-name">${r.naam}</p><p class="small muted num">${r.punten} punten${ok ? "" : ` · nog ${r.punten - loy.balance}`}</p></div>
            <button class="btn sm" data-redeem="${r.id}" ${ok ? "" : "disabled"} aria-label="${r.naam} inwisselen${ok ? "" : ", nog niet genoeg punten"}">Inwisselen</button></li>`; })}</ul></section>
      ${loy.vouchers.length ? html`<section class="stack" aria-labelledby="bonnen"><h2 id="bonnen">Demo-bonnen</h2><ul class="stack">${loy.vouchers.map((v) => html`<li class="card soft spread"><span>${v.naam}</span><span class="num"><strong>${v.code}</strong></span></li>`)}</ul><p class="small muted">Demo-bonnen zijn niet geldig bij De Zon.</p></section>` : ""}
      <section class="stack" aria-labelledby="his"><h2 id="his">Geschiedenis</h2>
        ${loy.entries.length ? html`<ul class="hist">${loy.entries.map((e) => html`<li><span class="grow">${e.label}<span class="small muted block">${formatDate(e.date)} · ${e.ref}</span></span><strong class="num">${e.type === "earn" ? "+" : "−"}${e.points}</strong></li>`)}</ul>`
        : html`<p class="muted">Nog geen punten. Plaats een demo-bestelling om te beginnen met sparen.</p><a class="btn secondary sm" href="#/menu">Naar het menu</a>`}</section>
      <section class="nodig-card"><h3>Echt sparen <span class="pill nodig">Koppeling nodig</span></h3>
        <p>Een echte spaarkaart heeft een centrale spaardatabase, herkenning aan de kassa en een inlog per klant. Pas dan zijn punten betrouwbaar. Zie docs/API-CONTRACT.md.</p></section>`;
  },
  mount(root, app) {
    const flip = $("#flip", root), btn = $("#flip-btn", root);
    const [front, back] = [$(".front", flip), $(".back", flip)];
    const onClick = async (e) => {
      if (e.target.closest("#flip-btn")) {
        const on = flip.classList.toggle("flipped");
        btn.setAttribute("aria-pressed", on);
        for (const [f, hidden] of [[front, on], [back, !on]]) { f.toggleAttribute("inert", hidden); f.setAttribute("aria-hidden", hidden); }
        return;
      }
      const r = e.target.closest("[data-redeem]");
      if (!r || r.disabled) return;
      const reward = app.data.config.loyalty.rewards.find((x) => x.id === r.dataset.redeem);
      if (!(await confirmSheet(app, { title: `${reward.naam} inwisselen?`, text: `Dit kost ${reward.punten} punten. Je krijgt een demo-bon die niet geldig is bij De Zon.`, yes: "Inwisselen", danger: false }))) return;
      try {
        const v = await app.ds.redeem(reward.id);
        app.rerender();
        app.openSheet(html`<h2>Demo-bon</h2><p class="card sun num center order-id">${v.code}</p><p>${v.naam}. Dit is een demo-bon: hij is niet geldig bij De Zon.</p><button class="btn" data-close>Sluiten</button>`, { label: "Demo-bon" });
      } catch (err) { app.toast(err.message, "error"); }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  },
};
