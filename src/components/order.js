import { html } from "../lib/dom.js";
import { formatEuro } from "../lib/money.mjs";

const dateFmt = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export const formatPickup = (o) => (o.pickup.asap ? "Zo snel mogelijk" : o.pickup.label || dateFmt.format(new Date(o.pickup.at)));
export const formatDate = (iso) => dateFmt.format(new Date(iso));

export const demoBanner = (text = "Deze bestelling is niet doorgestuurd en niet betaald. De Zon heeft hem niet ontvangen.") => html`
  <div class="demo-banner" role="note"><div><strong>Demomodus</strong>${text}</div></div>`;

export const orderLines = (o) => html`
  <ul class="olines">${o.lines.map((l) => html`
    <li><span class="num">${l.qty}×</span><span class="grow">${l.naam}${l.optionNames?.length ? html`<span class="muted small block">${l.optionNames.join(", ")}</span>` : ""}</span><span class="num">${formatEuro(l.total)}</span></li>`)}
    <li class="total"><span class="grow">Totaal</span><span class="num">${formatEuro(o.total)}</span></li>
  </ul>`;
