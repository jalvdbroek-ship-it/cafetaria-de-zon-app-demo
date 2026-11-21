import { html } from "../lib/dom.js";
import { openStatus, sunFraction, formatMinutes, dayName } from "../lib/hours.mjs";
import { cast } from "./cast-ui.js";

const CX = 200, CY = 200, R = 170;
const pos = (f) => [CX - R * Math.cos(Math.PI * f), CY - R * Math.sin(Math.PI * f)];

// Tekst naast de zonnewijzer: "Nu open tot 22:00" of "Gesloten, open morgen om 12:30".
export function statusText(now, hours) {
  const s = openStatus(now, hours);
  if (s.open) return { open: true, title: "Nu open", sub: `Tot ${formatMinutes(s.closesAt)}` };
  if (!s.next) return { open: false, title: "Nu gesloten", sub: "Bel voor de openingstijden" };
  const when = s.next.offset === 0 ? "vandaag" : s.next.offset === 1 ? "morgen" : dayName(s.next.dow);
  return { open: false, title: "Nu gesloten", sub: `Open ${when} om ${formatMinutes(s.next.minutes)}` };
}

export function sundial(now, hours, { intro = true } = {}) {
  const t = statusText(now, hours);
  const f = sunFraction(now, hours);
  const s = openStatus(now, hours);
  // Gesloten: de zon staat net onder de horizon (links voor opening, rechts na sluiting).
  const afterClose = !s.open && s.next && s.next.offset > 0;
  const [x, y] = f != null ? pos(f) : afterClose ? [CX + R, CY + 12] : [CX - R, CY + 12];
  return html`
    <section class="dial ${t.open ? "is-open" : "is-closed"}" aria-label="Openingsstatus">
      <svg viewBox="0 0 400 230" class="dial-svg" aria-hidden="true" focusable="false">
        <defs><clipPath id="sky"><rect x="0" y="0" width="400" height="200"/></clipPath></defs>
        <path class="dial-arc" d="M30 200A170 170 0 0 1 370 200"/>
        <line class="dial-horizon" x1="10" y1="200" x2="390" y2="200"/>
        <g clip-path="url(#sky)">
          <g class="sun" data-f="${f ?? ""}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
            <g class="sun-wob">${cast("zon-cool", -52, -54, 104, 112)}</g>
          </g>
        </g>
        <g clip-path="url(#sky)" class="cs-sleep">${cast("zon-sleep", 148, 124, 104, 112)}</g>
      </svg>
      <div class="dial-text">
        <p class="dial-title" aria-live="polite">${t.title}</p>
        <p class="dial-sub num">${t.sub}</p>
      </div>
    </section>`;
}

export function animateSun(root, now, hours, reduced) {
  const g = root.querySelector(".sun");
  const f = sunFraction(now, hours);
  if (!g || f == null || reduced) return;
  const start = performance.now(), dur = 1100;
  const tick = (t) => {
    const k = Math.min(1, (t - start) / dur), e = 1 - (1 - k) ** 3;
    const [x, y] = pos(f * e);
    g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    if (k < 1) requestAnimationFrame(tick);
  };
  g.setAttribute("transform", `translate(${pos(0)[0]} ${pos(0)[1]})`);
  requestAnimationFrame(tick);
}
